import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Table2 } from "lucide-react";
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
        description="Edit existing data or add new entries for each pillar. Changes require approval from Oliver, Sarika, or Ian before going live."
      />

      {!process.env.DATABASE_URL && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Database not configured — data entry is unavailable.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {EDITABLE_REPORT_TYPES.map((type) => (
          <div
            key={type}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="font-semibold text-slate-900">{REPORT_TYPE_LABELS[type]}</p>
            <p className="mt-1 text-sm text-slate-500">
              Edit existing rows or add new entries
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/data-entry/${type}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-800"
              >
                <Table2 className="h-4 w-4" />
                Edit all rows
              </Link>
              <Link
                href={`/data-entry/${type}?mode=add`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
              >
                <Plus className="h-4 w-4" />
                Add new entries
              </Link>
            </div>
            <p className="mt-3 text-xs font-medium text-emerald-700">
              View dashboard → {PILLAR_ROUTES[type]}
            </p>
          </div>
        ))}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Sales & Marketing data syncs from Zoho CRM and is not editable here.
      </p>
    </DashboardShell>
  );
}
