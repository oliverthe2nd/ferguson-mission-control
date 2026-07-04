import { PageHeader } from "@/components/layout/app-shell";
import {
  AtRiskTrendChart,
  AvgDaysPerStageChart,
  MilestoneFunnelChart,
} from "@/components/charts/enrolment-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { getPillarData, isStudentAtRisk } from "@/lib/dashboard-data";
import { formatOptionalDate } from "@/lib/format";
import type { EnrolmentMilestoneRow } from "@/lib/validators/enrolment-milestones";

export default async function EnrolmentDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel } =
    await getPillarData<EnrolmentMilestoneRow>("enrolment_milestones");

  const sortedRows = [...rows].sort((a, b) => {
    const aRisk = isStudentAtRisk(a) ? 0 : 1;
    const bRisk = isStudentAtRisk(b) ? 0 : 1;
    if (aRisk !== bRisk) return aRisk - bRisk;
    return a.student_name.localeCompare(b.student_name);
  });

  const atRiskCount = rows.filter((row) => isStudentAtRisk(row)).length;

  return (
    <>
      <PageHeader
        title="Enrolment & Finance"
        description="Milestone tracker — consultation fees through to final payment"
        lastUploadLabel={!usingSampleData ? lastUploadLabel : null}
      />
      {!hasDatabase && !usingSampleData && (
        <p className="mb-4 text-sm font-medium text-amber-700">Database not configured.</p>
      )}
      {usingSampleData && (
        <div className="liquid-glass mb-6 rounded-[1.25rem] border border-emerald-200/60 bg-white/55 px-4 py-3 text-sm text-dark shadow-[0_12px_40px_rgba(32,201,151,0.08)] backdrop-blur-xl">
          Showing sample template data ({rows.length} students, {atRiskCount} AT
          RISK). Upload live reports at{" "}
          <a href="/upload" className="font-bold text-emerald-700 underline">
            /upload
          </a>
          .
        </div>
      )}
      {!usingSampleData && rows.length > 0 && (
        <p className="mb-4 text-sm font-medium text-slate-600">
          {rows.length} students in latest cohort.
        </p>
      )}
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-6 grid gap-6 lg:grid-cols-3">
            <ChartCard title="Milestone Funnel">
              <MilestoneFunnelChart data={rows} />
            </ChartCard>
            <ChartCard title="AT RISK Overview">
              <AtRiskTrendChart data={rows} />
            </ChartCard>
            <ChartCard title="Avg Days per Stage">
              <AvgDaysPerStageChart data={rows} />
            </ChartCard>
          </div>

          <ChartCard title="Student Milestones" fill>
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-white/70 text-slate-600">
                  <tr>
                    <th className="px-3 py-2 font-bold">Student</th>
                    <th className="px-3 py-2 font-bold">ID</th>
                    <th className="px-3 py-2 font-bold">Registered</th>
                    <th className="px-3 py-2 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRows.map((row) => (
                    <tr key={row.student_id} className="border-b border-white/50">
                      <td className="px-3 py-2 font-medium">{row.student_name}</td>
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">
                        {row.student_id}
                      </td>
                      <td className="px-3 py-2">
                        {formatOptionalDate(row.registration_date) ?? "—"}
                      </td>
                      <td className="px-3 py-2">
                        {isStudentAtRisk(row) ? (
                          <Badge status="red">AT RISK</Badge>
                        ) : (
                          <Badge status="green">On Track</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>
        </>
      )}
    </>
  );
}
