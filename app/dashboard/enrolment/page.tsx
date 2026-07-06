import { PageHeader } from "@/components/layout/app-shell";
import {
  AtRiskTrendChart,
  AvgDaysPerStageChart,
  EnrolmentMonthlyChart,
  MilestoneFunnelChart,
} from "@/components/charts/enrolment-charts";
import { EnrolmentStudentTable } from "@/components/enrolment/enrolment-student-table";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SampleDataBoundary } from "@/components/dashboard/sample-data-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { isStudentAtRisk } from "@/lib/alerts";
import { getResolvedPillarData } from "@/lib/framework/pillar-resolve";
import type { EnrolmentMilestoneRow } from "@/lib/validators/enrolment-milestones";

export default async function EnrolmentDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel, forcedSampleFallback } =
    await getResolvedPillarData<EnrolmentMilestoneRow>("enrolment_milestones");

  const atRiskCount = rows.filter((row) => isStudentAtRisk(row)).length;

  return (
    <>
      <PageHeader
        title="Enrolment & Finance"
        description="Five fee milestones — consultation through final payment"
        lastUploadLabel={!usingSampleData ? lastUploadLabel : null}
      />
      {!hasDatabase && !usingSampleData && (
        <p className="mb-4 text-sm font-medium text-amber-700">Database not configured.</p>
      )}
      {forcedSampleFallback && (
        <p className="mb-4 text-sm font-medium text-amber-700">
          Live data incomplete — showing sample enrolment data until Zoho fee dates are available.
        </p>
      )}
      <SampleDataBoundary
        active={usingSampleData}
        hint={
          <>
            {rows.length} students, {atRiskCount} AT RISK
          </>
        }
      >
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="mb-6 grid gap-6 lg:grid-cols-2">
              <ChartCard title="Monthly Enrolments" subtitle="Click a month to drill down">
                <EnrolmentMonthlyChart data={rows} />
              </ChartCard>
              <ChartCard title="Milestone Funnel">
                <MilestoneFunnelChart data={rows} />
              </ChartCard>
              <ChartCard title="AT RISK Overview">
                <AtRiskTrendChart data={rows} />
              </ChartCard>
              <ChartCard title="Avg Days per Fee Stage">
                <AvgDaysPerStageChart data={rows} />
              </ChartCard>
            </div>
            <ChartCard title="Student Milestones" fill>
              <EnrolmentStudentTable rows={rows} />
            </ChartCard>
          </>
        )}
      </SampleDataBoundary>
    </>
  );
}
