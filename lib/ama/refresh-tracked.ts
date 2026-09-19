import { eq } from "drizzle-orm";
import { requireDb } from "@/lib/db";
import { flattenSnapshotRows, getLatestUploadSnapshots } from "@/lib/queries";
import { trackedReports } from "@/lib/schema";
import { filterSalesRowsByPipeline } from "@/lib/zoho/aggregate-sales-pipeline";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";
import type { VisaLodgementRow } from "@/lib/validators/visa-lodgement";

export async function refreshTrackedReport(id: string) {
  const database = requireDb();
  const [report] = await database
    .select()
    .from(trackedReports)
    .where(eq(trackedReports.id, id))
    .limit(1);

  if (!report) return null;

  const plan = (report.tool_plan ?? {}) as {
    report_type?: string;
    pipeline?: "All" | "Standard" | "Study Centre" | "YESSFUND";
  };

  const [sales, visa, enrolment] = await Promise.all([
    getLatestUploadSnapshots("sales_pipeline"),
    getLatestUploadSnapshots("visa_lodgement"),
    getLatestUploadSnapshots("enrolment_milestones"),
  ]);

  const salesRows = filterSalesRowsByPipeline(
    flattenSnapshotRows<SalesPipelineRow>(sales.snapshots),
    plan.pipeline ?? "Standard",
  );

  const result = {
    refreshed_at: new Date().toISOString(),
    question: report.question,
    tool_plan: plan,
    sales: salesRows.slice(0, 8),
    visa: flattenSnapshotRows<VisaLodgementRow>(visa.snapshots).slice(0, 12),
    enrolment_count: enrolment.snapshots.length
      ? flattenSnapshotRows(enrolment.snapshots).length
      : 0,
  };

  const [updated] = await database
    .update(trackedReports)
    .set({
      last_run_at: new Date(),
      last_result: result,
      updated_at: new Date(),
    })
    .where(eq(trackedReports.id, id))
    .returning();

  return updated;
}

export async function refreshDueTrackedReports() {
  const database = requireDb();
  const reports = await database.select().from(trackedReports);
  const daily = reports.filter((r) => r.schedule === "daily");
  const refreshed = [];

  for (const report of daily) {
    refreshed.push(await refreshTrackedReport(report.id));
  }

  return {
    refreshed: refreshed.filter(Boolean).length,
    total: daily.length,
  };
}
