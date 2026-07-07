import Link from "next/link";
import { REPORT_TYPE_LABELS, REPORT_TYPES, type ReportType } from "@/lib/constants";

const TEMPLATE_FILES: Record<ReportType, string> = {
  sales_pipeline: "sales-pipeline.csv",
  enrolment_milestones: "enrolment-milestones.csv",
  visa_lodgement: "visa-lodgement.csv",
  accounts_receivable: "accounts-receivable.csv",
  job_placement: "job-placement.csv",
  study_centres: "study-centres.csv",
};

export function TemplateDownloads() {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-dark">Sample templates</h2>
      <p className="mt-1 text-sm text-slate-600">
        Download a CSV template for each pillar, fill in your data, then upload
        above. For Accounts, you can also upload a MYOB{" "}
        <strong>Unpaid invoices report</strong> (.xlsx) export directly.
      </p>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {REPORT_TYPES.map((type) => (
          <li key={type}>
            <Link
              href={`/templates/${TEMPLATE_FILES[type]}`}
              download
              className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-700 hover:border-emerald hover:bg-mint"
            >
              <span>{REPORT_TYPE_LABELS[type]}</span>
              <span className="text-xs text-emerald">Download CSV</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
