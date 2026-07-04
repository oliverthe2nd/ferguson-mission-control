import { PageHeader } from "@/components/layout/app-shell";
import {
  ActiveStudentsTrendChart,
  AustraliaPipelineChart,
  BranchComparisonChart,
} from "@/components/charts/centres-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SampleDataBoundary } from "@/components/dashboard/sample-data-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { getPillarData } from "@/lib/dashboard-data";
import type { StudyCentresRow } from "@/lib/validators/study-centres";

export default async function CentresDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel } = await getPillarData<StudyCentresRow>("study_centres");

  return (
    <>
      <PageHeader
        title="Offshore Study Centres"
        description="Fiji, Port Moresby, and Lae — branch comparison and Australia pipeline"
        lastUploadLabel={!usingSampleData ? lastUploadLabel : null}
      />
      {!hasDatabase && !usingSampleData && (
        <p className="mb-4 text-sm font-medium text-amber-700">Database not configured.</p>
      )}
      <SampleDataBoundary
        active={usingSampleData}
        hint={
          <>
            Upload live reports at{" "}
            <a href="/upload" className="font-bold underline">
              /upload
            </a>
          </>
        }
      >
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
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
    </>
  );
}
