import { redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/app-shell";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireAdmin } from "@/lib/auth";
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
        <h2 className="mb-2 text-sm font-semibold text-dark">Role Management</h2>
        <p className="text-sm text-slate-600">
          Assign <code className="font-mono text-xs">admin</code> or{" "}
          <code className="font-mono text-xs">viewer</code> roles via Clerk user
          public metadata (<code className="font-mono text-xs">role</code> key).
          Admin users: Ian Ferguson, Sarika Ferguson, Oliver Barany.
        </p>
      </section>
    </DashboardShell>
  );
}
