import { PageHeader } from "@/components/layout/app-shell";
import {
  AvgDaysTrendChart,
  ConversionTrendChart,
  LeadSourceBarChart,
} from "@/components/charts/sales-pipeline-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SampleDataBoundary } from "@/components/dashboard/sample-data-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { getPillarData } from "@/lib/dashboard-data";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";

export default async function SalesDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel } = await getPillarData<SalesPipelineRow>("sales_pipeline");

  return (
    <>
      <PageHeader
        title="Sales & Marketing"
        description="Pipeline conversion — weekly lead source and conversion tracking"
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
          <ChartCard title="Lead Source Breakdown" className="lg:col-span-2">
            <LeadSourceBarChart data={rows} />
          </ChartCard>
          <ChartCard title="Conversion % Trend">
            <ConversionTrendChart data={rows} />
          </ChartCard>
          <ChartCard title="Average Days Trend">
            <AvgDaysTrendChart data={rows} />
          </ChartCard>
        </div>
      )}
      </SampleDataBoundary>
    </>
  );
}
