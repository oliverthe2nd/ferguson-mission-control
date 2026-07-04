import type { EditableReportType } from "./constants";

export type ColumnType = "text" | "number" | "date" | "enum";

export type ReportColumn = {
  key: string;
  label: string;
  type: ColumnType;
  options?: readonly string[];
  required?: boolean;
};

export const REPORT_COLUMNS: Record<EditableReportType, ReportColumn[]> = {
  enrolment_milestones: [
    { key: "student_id", label: "Student ID", type: "text", required: true },
    { key: "student_name", label: "Student Name", type: "text", required: true },
    { key: "registration_date", label: "Registration Date", type: "date" },
    { key: "m1_target", label: "M1 Target", type: "date" },
    { key: "m1_actual", label: "M1 Actual", type: "date" },
    { key: "m2_target", label: "M2 Target", type: "date" },
    { key: "m2_actual", label: "M2 Actual", type: "date" },
    { key: "m3_target", label: "M3 Target", type: "date" },
    { key: "m3_actual", label: "M3 Actual", type: "date" },
    { key: "m4_target", label: "M4 Target", type: "date" },
    { key: "m4_actual", label: "M4 Actual", type: "date" },
    { key: "m5_target", label: "M5 Target", type: "date" },
    { key: "m5_actual", label: "M5 Actual", type: "date" },
  ],
  visa_lodgement: [
    { key: "period", label: "Period", type: "date", required: true },
    { key: "visa_subclass", label: "Visa Subclass", type: "text", required: true },
    { key: "lodged_count", label: "Lodged", type: "number", required: true },
    { key: "refused_count", label: "Refused", type: "number", required: true },
    { key: "processing_count", label: "Processing", type: "number" },
    { key: "pending_actions_count", label: "Pending Actions", type: "number" },
    { key: "avg_days_file_to_lodgement", label: "Avg Days File→Lodge", type: "number" },
  ],
  accounts_receivable: [
    { key: "school_name", label: "School", type: "text", required: true },
    { key: "invoice_ref", label: "Invoice Ref", type: "text", required: true },
    { key: "invoice_date", label: "Invoice Date", type: "date", required: true },
    { key: "due_date", label: "Due Date", type: "date", required: true },
    { key: "amount_aud", label: "Amount (AUD)", type: "number", required: true },
    { key: "days_outstanding", label: "Days Outstanding", type: "number", required: true },
    { key: "last_contact_date", label: "Last Contact", type: "date" },
    { key: "last_contact_note", label: "Last Contact Note", type: "text" },
  ],
  job_placement: [
    { key: "period", label: "Period", type: "date", required: true },
    { key: "visa_approved_arrivals", label: "Visa Approved Arrivals", type: "number", required: true },
    { key: "settlement_assisted_count", label: "Settlement Assisted", type: "number", required: true },
    { key: "successfully_placed_jobs", label: "Jobs Placed", type: "number", required: true },
    { key: "testimonial1_count", label: "Testimonial 1", type: "number", required: true },
    { key: "testimonial2_written_count", label: "Written Testimonials", type: "number", required: true },
    { key: "testimonial2_video_count", label: "Video Testimonials", type: "number", required: true },
    { key: "incentives_paid_total", label: "Incentives Paid", type: "number", required: true },
  ],
  study_centres: [
    { key: "period", label: "Period", type: "date", required: true },
    {
      key: "branch",
      label: "Branch",
      type: "enum",
      options: ["Lautoka", "Port Moresby", "Lae"],
      required: true,
    },
    { key: "walkin_traffic", label: "Walk-in Traffic", type: "number", required: true },
    { key: "scheduled_leads", label: "Scheduled Leads", type: "number", required: true },
    { key: "new_registrations_local", label: "New Registrations", type: "number", required: true },
    { key: "offer_letters_issued", label: "Offer Letters", type: "number", required: true },
    { key: "active_year1_students", label: "Active Year 1", type: "number", required: true },
    { key: "followon_year2_year3_local", label: "Follow-on Y2–Y3 Local", type: "number", required: true },
    { key: "followon_year2_year3_australia", label: "Follow-on Y2–Y3 AU", type: "number", required: true },
  ],
};

export function emptyEditorRow(reportType: EditableReportType): Record<string, string> {
  return Object.fromEntries(
    REPORT_COLUMNS[reportType].map((col) => [col.key, col.type === "enum" && col.options?.[0] ? col.options[0] : ""]),
  );
}
