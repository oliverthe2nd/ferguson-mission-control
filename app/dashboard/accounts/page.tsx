import { PageHeader } from "@/components/layout/app-shell";
import {
  ArBucketChart,
  ReceivablesTrendChart,
  SchoolOutstandingChart,
} from "@/components/charts/accounts-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getArStatus, getPillarData } from "@/lib/dashboard-data";
import { formatAud } from "@/lib/format";
import type { AccountsReceivableRow } from "@/lib/validators/accounts-receivable";

export default async function AccountsDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel } = await getPillarData<AccountsReceivableRow>("accounts_receivable");

  return (
    <>
      <PageHeader
        title="Accounts"
        description="School commission receivables — delinquency tracking and follow-ups"
        lastUploadLabel={!usingSampleData ? lastUploadLabel : null}
      />
      {!hasDatabase && (
        <p className="mb-4 text-sm font-medium text-amber-700">Database not configured.</p>
      )}
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <ChartCard title="AR by Delinquency Bucket">
              <ArBucketChart data={rows} />
            </ChartCard>
            <ChartCard title="Total Receivables">
              <ReceivablesTrendChart data={rows} />
            </ChartCard>
            <ChartCard title="Per-School Outstanding">
              <SchoolOutstandingChart data={rows} />
            </ChartCard>
          </div>

          <ChartCard title="Receivables Detail" fill>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/70 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-bold">School</th>
                    <th className="px-3 py-2 font-bold">Invoice</th>
                    <th className="px-3 py-2 font-bold">Amount</th>
                    <th className="px-3 py-2 font-bold">Days</th>
                    <th className="px-3 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const status = getArStatus(row.days_outstanding);
                    return (
                      <tr key={row.invoice_ref} className="border-b border-white/50">
                        <td className="px-3 py-2">{row.school_name}</td>
                        <td className="px-3 py-2 font-mono text-xs">{row.invoice_ref}</td>
                        <td className="px-3 py-2 font-mono">{formatAud(row.amount_aud)}</td>
                        <td className="px-3 py-2">{row.days_outstanding}</td>
                        <td className="px-3 py-2">
                          <Badge status={status.severity}>{status.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}
    </>
  );
}
