import {
  IncentivesVsPlacementsChart,
  PlacementFunnelChart,
  TestimonialBreakdownChart,
} from "@/components/charts/placement-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { DashboardReportSection } from "@/components/dashboard/dashboard-report-section";
import { SampleDataBoundary } from "@/components/dashboard/sample-data-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { getResolvedPillarData } from "@/lib/framework/pillar-resolve";
import type { JobPlacementRow } from "@/lib/validators/job-placement";

export default async function PlacementDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel } =
    await getResolvedPillarData<JobPlacementRow>("job_placement");

  return (
    <DashboardReportSection
      title="Job Placement & Settlement"
      description="Monthly placement funnel, testimonials, and incentive tracking"
      lastUploadLabel={!usingSampleData ? lastUploadLabel : null}
    >
      {!hasDatabase && !usingSampleData && (
        <p className="text-sm font-medium text-amber-700">Database not configured.</p>
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
            <ChartCard title="Placement Funnel">
              <PlacementFunnelChart data={rows} />
            </ChartCard>
            <ChartCard title="Testimonial Breakdown">
              <TestimonialBreakdownChart data={rows} />
            </ChartCard>
            <ChartCard title="Incentives vs Placements" className="lg:col-span-2">
              <IncentivesVsPlacementsChart data={rows} />
            </ChartCard>
          </div>
        )}
      </SampleDataBoundary>
    </DashboardReportSection>
  );
}
