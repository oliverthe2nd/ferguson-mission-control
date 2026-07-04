import type { ReportType } from "./constants";
import { accountsReceivableSchema } from "./validators/accounts-receivable";
import { enrolmentMilestonesSchema } from "./validators/enrolment-milestones";
import { jobPlacementSchema } from "./validators/job-placement";
import { salesPipelineSchema } from "./validators/sales-pipeline";
import { studyCentresSchema } from "./validators/study-centres";
import { visaLodgementSchema } from "./validators/visa-lodgement";

export class ParseError extends Error {
  constructor(
    public reportType: ReportType,
    message: string,
    public rowNumber?: number,
  ) {
    super(message);
    this.name = "ParseError";
  }
}

export function validateReportData(reportType: ReportType, rows: unknown[]) {
  try {
    switch (reportType) {
      case "sales_pipeline":
        return salesPipelineSchema.parse(rows);
      case "enrolment_milestones": {
        const filtered = rows.filter((row) => {
          const record = row as Record<string, unknown>;
          const id = record.student_id;
          return id != null && String(id).trim() !== "";
        });
        return enrolmentMilestonesSchema.parse(filtered);
      }
      case "visa_lodgement":
        return visaLodgementSchema.parse(rows);
      case "accounts_receivable":
        return accountsReceivableSchema.parse(rows);
      case "job_placement":
        return jobPlacementSchema.parse(rows);
      case "study_centres":
        return studyCentresSchema.parse(rows);
      default:
        throw new ParseError(reportType as ReportType, "Unknown report type");
    }
  } catch (error) {
    if (error instanceof ParseError) throw error;
    const message =
      error instanceof Error ? error.message : "Validation failed";
    throw new ParseError(reportType, message);
  }
}

export function getPeriodDate(reportType: ReportType, row: Record<string, unknown>): Date {
  switch (reportType) {
    case "sales_pipeline":
      return new Date(String(row.period_start));
    case "enrolment_milestones": {
      const date =
        row.registration_date ??
        row.m1_target ??
        row.m4_target ??
        row.m5_target;
      return date ? new Date(String(date)) : new Date();
    }
    case "visa_lodgement":
    case "job_placement":
    case "study_centres":
      return new Date(String(row.period));
    case "accounts_receivable":
      return new Date(String(row.invoice_date));
    default:
      return new Date();
  }
}
