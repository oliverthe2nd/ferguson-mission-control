export const CHART_COLORS = {
  primary: "#20C997",
  secondary: "#2BAE4A",
  alert: "#E45A2A",
  amber: "#F6A20B",
  dark: "#1F2A3D",
  grid: "#E8EEF5",
  muted: "#6D7F98",
  background: "#F2F8F6",
} as const;

export const KPI = {
  LEAD_TO_REG_TARGET_PCT: 20,
  MAX_DAYS_REG_TO_OFFER: 4,
  MAX_DAYS_OFFER_TO_PAYMENT: 30,
  MAX_DAYS_VISA_LODGE_TURNAROUND: 7,
  MILESTONE_STALL_DAYS: 7,
  AR_AMBER_DAYS: 30,
  AR_RED_DAYS: 60,
  AR_LEGAL_DAYS: 90,
} as const;

export const REPORT_TYPES = [
  "sales_pipeline",
  "enrolment_milestones",
  "visa_lodgement",
  "accounts_receivable",
  "job_placement",
  "study_centres",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

/** Pillars managers can edit in-app (sales comes from Zoho). */
export const EDITABLE_REPORT_TYPES = [
  "enrolment_milestones",
  "visa_lodgement",
  "accounts_receivable",
  "job_placement",
  "study_centres",
] as const;

export type EditableReportType = (typeof EDITABLE_REPORT_TYPES)[number];

export const APPROVER_EMAILS = [
  "oliver@ferguson4me.com",
  "sarika@ferguson4me.com",
  "ian@ferguson4me.com",
] as const;

export function isEditableReportType(value: string): value is EditableReportType {
  return (EDITABLE_REPORT_TYPES as readonly string[]).includes(value);
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  sales_pipeline: "Sales & Marketing",
  enrolment_milestones: "Enrolment & Finance",
  visa_lodgement: "Visa Team",
  accounts_receivable: "Accounts",
  job_placement: "Job Placement",
  study_centres: "Study Centres",
};

export const PILLAR_ROUTES: Record<ReportType, string> = {
  sales_pipeline: "/dashboard/sales",
  enrolment_milestones: "/dashboard/enrolment",
  visa_lodgement: "/dashboard/visa",
  accounts_receivable: "/dashboard/accounts",
  job_placement: "/dashboard/placement",
  study_centres: "/dashboard/centres",
};

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export const ALLOWED_UPLOAD_EXTENSIONS = [".xlsx", ".csv"] as const;
