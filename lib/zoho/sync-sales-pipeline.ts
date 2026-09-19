import { eq } from "drizzle-orm";
import { revalidateDashboardData } from "@/lib/cached-queries";
import { requireDb } from "@/lib/db";
import { getPeriodDate, validateReportData } from "@/lib/parse";
import { reportSnapshots, uploads, zohoPipelineStages } from "@/lib/schema";
import { ZOHO_SYNC_WEEKS } from "./config";
import {
  fetchAllDealsInRange,
  fetchAllLeadsInRange,
  fetchDealStageHistory,
  isZohoScopeError,
  mapWithConcurrency,
} from "./client";
import {
  aggregateSalesPipelineRows,
  countStudyCentreStages,
  filterConvertedDeals,
} from "./aggregate-sales-pipeline";
import { formatZohoDateTime, zohoBetweenRange } from "./weeks";

export type ZohoSalesSyncResult = {
  rowCount: number;
  uploadId: string;
  weeks: number;
  leadsFetched: number;
  dealsFetched: number;
  stageHistoriesFetched: number;
  studyCentreStages: number;
  pipelines: string[];
};

export async function syncSalesPipelineFromZoho(options?: {
  weekCount?: number;
  uploadedBy?: string;
}): Promise<ZohoSalesSyncResult> {
  const weekCount = options?.weekCount ?? ZOHO_SYNC_WEEKS;
  const { start, end, weeks } = zohoBetweenRange(weekCount);
  const startIso = formatZohoDateTime(start);
  const endIso = formatZohoDateTime(end);

  const [leads, deals] = await Promise.all([
    fetchAllLeadsInRange(startIso, endIso),
    fetchAllDealsInRange(startIso, endIso),
  ]);

  const convertedDeals = filterConvertedDeals(deals);
  let stageHistoryLimited = false;

  if (convertedDeals.length > 0) {
    try {
      await fetchDealStageHistory(convertedDeals[0]!.id);
    } catch (error) {
      // Missing settings/related_lists scopes is common — continue with stage fallbacks.
      stageHistoryLimited = true;
      if (!isZohoScopeError(error)) {
        console.warn(
          "Zoho Stage_History unavailable; continuing without it:",
          error instanceof Error ? error.message : error,
        );
      }
    }
  }

  const histories = await mapWithConcurrency(
    convertedDeals,
    4,
    async (deal) => {
      if (stageHistoryLimited) {
        return { deal, history: [] };
      }
      try {
        return {
          deal,
          history: await fetchDealStageHistory(deal.id),
        };
      } catch (error) {
        if (isZohoScopeError(error)) {
          stageHistoryLimited = true;
          return { deal, history: [] };
        }
        // One deal failing history shouldn't abort the whole sync.
        console.warn(
          `Zoho Stage_History failed for deal ${deal.id}:`,
          error instanceof Error ? error.message : error,
        );
        return { deal, history: [] };
      }
    },
  );

  const rows = aggregateSalesPipelineRows({
    weekStarts: weeks,
    leads,
    deals: histories,
  });

  const studyCentreStages = countStudyCentreStages(deals);

  const validated = validateReportData("sales_pipeline", rows);
  const database = requireDb();
  const uploadedBy = options?.uploadedBy ?? "zoho-sync";
  const fileName = `zoho-sales-sync-${new Date().toISOString().slice(0, 10)}.json`;

  const [upload] = await database
    .insert(uploads)
    .values({
      report_type: "sales_pipeline",
      uploaded_by: uploadedBy,
      file_name: fileName,
      row_count: String(validated.length),
    })
    .returning();

  await database.insert(reportSnapshots).values(
    validated.map((row) => ({
      upload_id: upload.id,
      report_type: "sales_pipeline" as const,
      period_date: getPeriodDate(
        "sales_pipeline",
        row as Record<string, unknown>,
      ),
      data: row,
    })),
  );

  await database
    .delete(zohoPipelineStages)
    .where(eq(zohoPipelineStages.pipeline, "Study Centre"));

  if (studyCentreStages.length > 0) {
    await database.insert(zohoPipelineStages).values({
      pipeline: "Study Centre",
      stages: studyCentreStages,
    });
  }

  revalidateDashboardData("sales_pipeline");
  revalidateDashboardData("study_centres");

  const pipelineSet = new Set(
    validated.map((row) => {
      const r = row as { pipeline?: string };
      return r.pipeline ?? "Standard";
    }),
  );

  return {
    rowCount: validated.length,
    uploadId: upload.id,
    weeks: weekCount,
    leadsFetched: leads.length,
    dealsFetched: deals.length,
    stageHistoriesFetched: histories.length,
    studyCentreStages: studyCentreStages.length,
    pipelines: [...pipelineSet],
  };
}
