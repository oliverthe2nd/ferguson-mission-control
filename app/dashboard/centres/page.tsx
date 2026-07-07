import {
  ActiveStudentsTrendChart,
  AustraliaPipelineChart,
  BranchComparisonChart,
} from "@/components/charts/centres-charts";
import {
  ScheduledLeadsChart,
  StudyCentreAvgDaysChart,
  StudyCentrePipelineChart,
  WalkInTrafficChart,
} from "@/components/charts/study-centre-extended-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DashboardReportSection } from "@/components/dashboard/dashboard-report-section";
import { SampleDataBoundary } from "@/components/dashboard/sample-data-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import {
  getResolvedPillarData,
  resolveStudyCentreAvgDays,
  resolveStudyCentrePipeline,
} from "@/lib/framework/pillar-resolve";
import type { StudyCentresRow } from "@/lib/validators/study-centres";

export default async function CentresDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel, forcedSampleFallback } =
    await getResolvedPillarData<StudyCentresRow>("study_centres");
  const { stages } = resolveStudyCentrePipeline(usingSampleData);
  const { rows: avgDays } = resolveStudyCentreAvgDays(usingSampleData);

  return (
    <DashboardReportSection
      title="Offshore Study Centres"
      description="Lautoka, Port Moresby, and Lae — walk-ins, pipeline, and Australia progression"
      lastUploadLabel={!usingSampleData ? lastUploadLabel : null}
    >
      {!hasDatabase && !usingSampleData && (
        <p className="text-sm font-medium text-amber-700">Database not configured.</p>
      )}
      {forcedSampleFallback && (
        <p className="text-sm font-medium text-amber-700">
          Live study centre data incomplete — showing sample until walk-in traffic is uploaded.
        </p>
      )}
      <SampleDataBoundary active={usingSampleData} hint="Spreadsheet upload at /upload or /data-entry">
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Walk-in Traffic" subtitle="By branch — click to drill down">
              <WalkInTrafficChart data={rows} />
            </ChartCard>
            <ChartCard title="Scheduled Leads">
              <ScheduledLeadsChart data={rows} />
            </ChartCard>
            <ChartCard title="Enrolment Pipeline" subtitle="Kim-verification stages" className="lg:col-span-2">
              <StudyCentrePipelineChart stages={stages} />
            </ChartCard>
            <ChartCard title="Avg Days: Reg → Offer & Offer → Installment" className="lg:col-span-2">
              <StudyCentreAvgDaysChart data={avgDays} />
            </ChartCard>
            <ChartCard title="Branch Comparison">
              <BranchComparisonChart data={rows} />
            </ChartCard>
            <ChartCard title="Active Students Trend">
              <ActiveStudentsTrendChart data={rows} />
            </ChartCard>
            <ChartCard title="Australia Pipeline" className="lg:col-span-2">
              <AustraliaPipelineChart data={rows} />
            </ChartCard>
          </div>
        )}
      </SampleDataBoundary>
    </DashboardReportSection>
  );
}
