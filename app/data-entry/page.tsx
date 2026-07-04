import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireDataEntryAccess } from "@/lib/auth";
import {
  EDITABLE_REPORT_TYPES,
  PILLAR_ROUTES,
  REPORT_TYPE_LABELS,
} from "@/lib/constants";

export default async function DataEntryPage() {
  const user = await requireDataEntryAccess();
  if (!user) {
    redirect("/dashboard");
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Data Entry"
        description="Edit report data in a spreadsheet view. Changes require approval from Oliver, Sarika, or Ian before going live."
      />

      {!process.env.DATABASE_URL && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Database not configured — data entry is unavailable.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {EDITABLE_REPORT_TYPES.map((type) => (
          <Link
            key={type}
            href={`/data-entry/${type}`}
            className="rounded-xl border border-slate-200 bg-white p-5 transition hover:border-emerald-300 hover:shadow-md"
          >
            <p className="font-semibold text-slate-900">{REPORT_TYPE_LABELS[type]}</p>
            <p className="mt-1 text-sm text-slate-500">
              Edit {REPORT_TYPE_LABELS[type].toLowerCase()} data
            </p>
            <p className="mt-3 text-xs font-medium text-emerald-700">
              View dashboard → {PILLAR_ROUTES[type]}
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Sales & Marketing data syncs from Zoho CRM and is not editable here.
      </p>
    </DashboardShell>
  );
}
