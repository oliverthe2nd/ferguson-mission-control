import { desc, eq } from "drizzle-orm";
import { tool } from "ai";
import { z } from "zod";
import { buildAlertTray } from "@/lib/alerts";
import {
  KPI,
  REPORT_TYPE_LABELS,
  REPORT_TYPES,
  type ReportType,
} from "@/lib/constants";
import { requireDb } from "@/lib/db";
import { flattenSnapshotRows, getLatestUploadSnapshots } from "@/lib/queries";
import { trackedReports } from "@/lib/schema";
import { SALES_PIPELINE_LABELS } from "@/lib/zoho-sales-mapping";
import { filterSalesRowsByPipeline } from "@/lib/zoho/aggregate-sales-pipeline";
import type { AccountsReceivableRow } from "@/lib/validators/accounts-receivable";
import type { EnrolmentMilestoneRow } from "@/lib/validators/enrolment-milestones";
import type { JobPlacementRow } from "@/lib/validators/job-placement";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";
import type { StudyCentresRow } from "@/lib/validators/study-centres";
import type { VisaLodgementRow } from "@/lib/validators/visa-lodgement";
import { getLatestStudyCentreStages } from "@/lib/zoho/pipeline-stages";

const reportTypeSchema = z.enum(REPORT_TYPES);

async function loadPillarRows(reportType: ReportType) {
  const { snapshots, upload } = await getLatestUploadSnapshots(reportType);
  return {
    upload,
    rows: flattenSnapshotRows(snapshots),
  };
}

export function createAmaTools(ownerEmail: string) {
  return {
    list_available_metrics: tool({
      description:
        "List Mission Control pillars, KPI targets, and Zoho deal pipelines available for questions.",
      inputSchema: z.object({}),
      execute: async () => ({
        pillars: REPORT_TYPES.map((type) => ({
          report_type: type,
          label: REPORT_TYPE_LABELS[type],
        })),
        pipelines: [...SALES_PIPELINE_LABELS],
        kpi: KPI,
      }),
    }),

    query_report_snapshots: tool({
      description:
        "Query the latest published snapshot rows for a report pillar. For sales_pipeline, optionally filter by Zoho pipeline.",
      inputSchema: z.object({
        report_type: reportTypeSchema,
        pipeline: z
          .enum(["All", "Standard", "Study Centre", "YESSFUND"])
          .optional()
          .describe("Only for sales_pipeline"),
        limit: z.number().int().min(1).max(200).optional().default(40),
      }),
      execute: async ({ report_type, pipeline, limit }) => {
        const { upload, rows } = await loadPillarRows(report_type);
        let data = rows as unknown[];

        if (report_type === "sales_pipeline") {
          data = filterSalesRowsByPipeline(
            rows as SalesPipelineRow[],
            pipeline ?? "All",
          );
        }

        return {
          report_type,
          label: REPORT_TYPE_LABELS[report_type],
          upload: upload
            ? {
                id: upload.id,
                file_name: upload.file_name,
                uploaded_by: upload.uploaded_by,
                created_at: upload.created_at,
                row_count: upload.row_count,
              }
            : null,
          row_count: data.length,
          rows: data.slice(0, limit),
        };
      },
    }),

    compare_periods: tool({
      description:
        "Compare the two most recent period buckets for a numeric field on a pillar.",
      inputSchema: z.object({
        report_type: reportTypeSchema,
        field: z.string().describe("Numeric field name on each row"),
        pipeline: z
          .enum(["All", "Standard", "Study Centre", "YESSFUND"])
          .optional(),
      }),
      execute: async ({ report_type, field, pipeline }) => {
        const { rows } = await loadPillarRows(report_type);
        let data = rows as Record<string, unknown>[];

        if (report_type === "sales_pipeline") {
          data = filterSalesRowsByPipeline(
            rows as SalesPipelineRow[],
            pipeline ?? "Standard",
          ) as unknown as Record<string, unknown>[];
        }

        if (data.length < 2) {
          return { error: "Need at least two periods to compare", rows: data.length };
        }

        const latest = data[0]!;
        const previous = data[1]!;
        const latestValue = Number(latest[field] ?? 0);
        const previousValue = Number(previous[field] ?? 0);
        const delta = latestValue - previousValue;
        const deltaPct =
          previousValue === 0 ? null : (delta / previousValue) * 100;

        return {
          report_type,
          field,
          latest: { period: latest.period_start ?? latest.period, value: latestValue },
          previous: {
            period: previous.period_start ?? previous.period,
            value: previousValue,
          },
          delta,
          delta_pct: deltaPct,
        };
      },
    }),

    get_alerts: tool({
      description: "Get current Mission Control KPI alerts across pillars.",
      inputSchema: z.object({}),
      execute: async () => {
        const [sales, enrolment, visa, accounts] = await Promise.all([
          loadPillarRows("sales_pipeline"),
          loadPillarRows("enrolment_milestones"),
          loadPillarRows("visa_lodgement"),
          loadPillarRows("accounts_receivable"),
        ]);

        const salesRows = filterSalesRowsByPipeline(
          sales.rows as SalesPipelineRow[],
          "Standard",
        );

        const alerts = buildAlertTray({
          sales: salesRows,
          enrolment: enrolment.rows as EnrolmentMilestoneRow[],
          visa: visa.rows as VisaLodgementRow[],
          accounts: accounts.rows as AccountsReceivableRow[],
        });

        return { alerts, count: alerts.length };
      },
    }),

    get_study_centre_stages: tool({
      description:
        "Get live Zoho Study Centre deal stage counts from the latest sync.",
      inputSchema: z.object({}),
      execute: async () => {
        const stages = await getLatestStudyCentreStages();
        return {
          stages: stages ?? [],
          source: stages?.length ? "zoho" : "empty",
        };
      },
    }),

    summarize_overview: tool({
      description:
        "Build a compact overview of the latest metrics across all six pillars.",
      inputSchema: z.object({}),
      execute: async () => {
        const [sales, enrolment, visa, accounts, placement, centres] =
          await Promise.all([
            loadPillarRows("sales_pipeline"),
            loadPillarRows("enrolment_milestones"),
            loadPillarRows("visa_lodgement"),
            loadPillarRows("accounts_receivable"),
            loadPillarRows("job_placement"),
            loadPillarRows("study_centres"),
          ]);

        const salesRows = filterSalesRowsByPipeline(
          sales.rows as SalesPipelineRow[],
          "Standard",
        );
        const latestSales = salesRows[0];
        const enrolmentRows = enrolment.rows as EnrolmentMilestoneRow[];
        const visaRows = visa.rows as VisaLodgementRow[];
        const accountsRows = accounts.rows as AccountsReceivableRow[];
        const placementRows = placement.rows as JobPlacementRow[];
        const centresRows = centres.rows as StudyCentresRow[];

        return {
          sales: latestSales
            ? {
                pipeline: "Standard",
                lead_to_reg_pct: latestSales.lead_to_reg_pct,
                total_registrations: latestSales.total_registrations,
                period_start: latestSales.period_start,
              }
            : null,
          enrolment: {
            students: enrolmentRows.length,
          },
          visa: {
            lodged: visaRows.reduce((s, r) => s + r.lodged_count, 0),
            refused: visaRows.reduce((s, r) => s + r.refused_count, 0),
          },
          accounts: {
            invoices: accountsRows.length,
            total_aud: accountsRows.reduce((s, r) => s + r.amount_aud, 0),
          },
          placement: placementRows[0]
            ? {
                successfully_placed_jobs:
                  placementRows[0].successfully_placed_jobs,
                period: placementRows[0].period,
              }
            : null,
          centres: {
            active_year1: centresRows.reduce(
              (s, r) => s + r.active_year1_students,
              0,
            ),
          },
        };
      },
    }),

    save_tracked_report: tool({
      description:
        "Save a natural-language question as a continuously tracked report (daily refresh).",
      inputSchema: z.object({
        title: z.string().min(3).max(120),
        question: z.string().min(5).max(1000),
        tool_plan: z
          .record(z.string(), z.unknown())
          .optional()
          .describe("Optional structured filters to re-run later"),
        schedule: z.enum(["manual", "daily"]).optional().default("daily"),
      }),
      execute: async ({ title, question, tool_plan, schedule }) => {
        const database = requireDb();
        const [row] = await database
          .insert(trackedReports)
          .values({
            owner_email: ownerEmail,
            title,
            question,
            tool_plan: tool_plan ?? {},
            schedule: schedule ?? "daily",
          })
          .returning();

        return {
          id: row.id,
          title: row.title,
          schedule: row.schedule,
          message: `Saved tracked report “${row.title}”. It will refresh on the ${row.schedule} schedule.`,
        };
      },
    }),

    list_tracked_reports: tool({
      description: "List tracked reports for the current user.",
      inputSchema: z.object({}),
      execute: async () => {
        const database = requireDb();
        const rows = await database
          .select()
          .from(trackedReports)
          .where(eq(trackedReports.owner_email, ownerEmail))
          .orderBy(desc(trackedReports.created_at))
          .limit(50);

        return {
          reports: rows.map((row) => ({
            id: row.id,
            title: row.title,
            question: row.question,
            schedule: row.schedule,
            last_run_at: row.last_run_at,
            has_result: row.last_result != null,
          })),
        };
      },
    }),

    run_tracked_report: tool({
      description:
        "Re-run a saved tracked report using its stored question context and latest Neon data.",
      inputSchema: z.object({
        id: z.string().uuid(),
      }),
      execute: async ({ id }) => {
        const database = requireDb();
        const [report] = await database
          .select()
          .from(trackedReports)
          .where(eq(trackedReports.id, id))
          .limit(1);

        if (!report || report.owner_email !== ownerEmail) {
          return { error: "Tracked report not found" };
        }

        const overview = await (async () => {
          const [sales, visa, enrolment] = await Promise.all([
            loadPillarRows("sales_pipeline"),
            loadPillarRows("visa_lodgement"),
            loadPillarRows("enrolment_milestones"),
          ]);
          return {
            sales_standard: filterSalesRowsByPipeline(
              sales.rows as SalesPipelineRow[],
              "Standard",
            ).slice(0, 4),
            visa_rows: (visa.rows as VisaLodgementRow[]).slice(0, 10),
            enrolment_count: enrolment.rows.length,
            question: report.question,
            tool_plan: report.tool_plan,
          };
        })();

        await database
          .update(trackedReports)
          .set({
            last_run_at: new Date(),
            last_result: overview,
            updated_at: new Date(),
          })
          .where(eq(trackedReports.id, id));

        return {
          id: report.id,
          title: report.title,
          question: report.question,
          result: overview,
        };
      },
    }),
  };
}

export const AMA_SYSTEM_PROMPT = `You are Ask Me Anything for Ferguson Education & Migration Mission Control (Single Source of Truth).

Rules:
- Only answer using tool results. If data is missing, say so and suggest syncing Zoho / Google Visa sheet / SharePoint enrolment from Admin.
- Zoho deal pipelines: Standard, Study Centre, YESSFUND. Leads volume is attributed to Standard.
- Six pillars: sales_pipeline, enrolment_milestones, visa_lodgement, accounts_receivable, job_placement, study_centres.
- When the user asks for a live report, call tools then present a clear structured summary with numbers, periods, and comparisons.
- When they ask to save/track a report, call save_tracked_report with a concise title.
- Be concise and executive-ready. Do not invent metrics.`;
