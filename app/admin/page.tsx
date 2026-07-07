import { redirect } from "next/navigation";
import { ZohoSalesSyncButton } from "@/components/admin/zoho-sales-sync";
import { PageHeader } from "@/components/layout/app-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireAdmin } from "@/lib/auth";
import { isZohoConfigured } from "@/lib/zoho/config";
import { DATA_REQUIREMENTS } from "@/lib/framework/data-requirements";
import { formatDate } from "@/lib/format";
import { getUploadHistory } from "@/lib/queries";
import { REPORT_TYPE_LABELS, type ReportType } from "@/lib/constants";

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (!admin) {
    redirect("/dashboard");
  }

  let history: Awaited<ReturnType<typeof getUploadHistory>> = [];
  if (process.env.DATABASE_URL) {
    try {
      history = await getUploadHistory();
    } catch {
      history = [];
    }
  }

  return (
    <DashboardShell>
      <PageHeader
        title="Admin"
        description="Upload history and data audit log"
      />

      {!process.env.DATABASE_URL && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Database not configured — upload history unavailable.
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-4 text-sm font-semibold text-dark">Upload History</h2>
        {history.length === 0 ? (
          <p className="text-sm text-slate-500">No uploads yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2">Report</th>
                  <th className="px-3 py-2">File</th>
                  <th className="px-3 py-2">Rows</th>
                  <th className="px-3 py-2">Uploaded by</th>
                </tr>
              </thead>
              <tbody>
                {history.map((row) => (
                  <tr key={row.id} className="border-b border-slate-100">
                    <td className="px-3 py-2">{formatDate(row.created_at)}</td>
                    <td className="px-3 py-2">
                      {REPORT_TYPE_LABELS[row.report_type as ReportType] ?? row.report_type}
                    </td>
                    <td className="px-3 py-2">{row.file_name}</td>
                    <td className="px-3 py-2 font-mono">{row.row_count}</td>
                    <td className="px-3 py-2">{row.uploaded_by}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-dark">Zoho CRM Sync</h2>
        {isZohoConfigured() ? (
          <>
            <p className="mb-4 text-sm text-slate-600">
              Pull the last 12 weeks of leads and deal stage history into Sales
              &amp; Marketing. This creates a new upload snapshot in Neon.
              Stage transition dates need{" "}
              <code className="font-mono text-xs">
                ZohoCRM.settings.related_lists.READ
              </code>{" "}
              in addition to leads/deals read scopes.
            </p>
            <ZohoSalesSyncButton />
          </>
        ) : (
          <p className="text-sm text-slate-600">
            Add Zoho OAuth credentials to{" "}
            <code className="font-mono text-xs">.env.local</code> to enable
            automatic sales pipeline sync.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-dark">Role Management</h2>
        <p className="text-sm text-slate-600">
          Assign roles via Clerk user public metadata (
          <code className="font-mono text-xs">role</code> key):
        </p>
        <ul className="mt-2 list-inside list-disc text-sm text-slate-600">
          <li>
            <code className="font-mono text-xs">admin</code> — bulk CSV upload, Zoho sync, full access
          </li>
          <li>
            <code className="font-mono text-xs">editor</code> — data entry only (no dashboard access); team leaders approve via email match
          </li>
          <li>
            <code className="font-mono text-xs">viewer</code> — read-only dashboards (default)
          </li>
        </ul>
        <p className="mt-3 text-sm text-slate-600">
          Approvers are matched by email: oliver@ferguson4me.com, sarika@ferguson4me.com,
          ian@ferguson4me.com — no extra Clerk role required.
        </p>
      </section>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-4">
        <h2 className="mb-2 text-sm font-semibold text-dark">Data needed for live charts</h2>
        <p className="mb-3 text-sm text-slate-600">
          Pillars show SAMPLE ONLY until these items are provided. Blockers marked with ●.
        </p>
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-slate-600">
              <tr>
                <th className="px-2 py-2">Pillar</th>
                <th className="px-2 py-2">Data needed</th>
                <th className="px-2 py-2">Source</th>
                <th className="px-2 py-2">Owner</th>
              </tr>
            </thead>
            <tbody>
              {DATA_REQUIREMENTS.map((req) => (
                <tr key={`${req.pillar}-${req.item}`} className="border-b border-slate-100">
                  <td className="px-2 py-2 font-medium">
                    {req.blocker ? "● " : ""}
                    {req.pillar}
                  </td>
                  <td className="px-2 py-2">{req.item}</td>
                  <td className="px-2 py-2 text-slate-500">{req.source}</td>
                  <td className="px-2 py-2 text-slate-500">{req.owner}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </DashboardShell>
  );
}
