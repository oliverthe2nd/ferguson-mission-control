import { PageHeader } from "@/components/layout/app-shell";
import {
  LeadConversionChart,
  LeadSourceBarChart,
  RegistrationsTrendChart,
  TotalLeadsChart,
} from "@/components/charts/sales-pipeline-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SampleDataBoundary } from "@/components/dashboard/sample-data-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { getResolvedPillarData } from "@/lib/framework/pillar-resolve";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";

export default async function SalesDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel, forcedSampleFallback } =
    await getResolvedPillarData<SalesPipelineRow>("sales_pipeline");

  return (
    <>
      <PageHeader
        title="Sales & Marketing"
        description="Pipeline conversion — lead source and registration tracking"
        lastUploadLabel={!usingSampleData ? lastUploadLabel : null}
      />
      {!hasDatabase && !usingSampleData && (
        <p className="mb-4 text-sm font-medium text-amber-700">Database not configured.</p>
      )}
      {forcedSampleFallback && (
        <p className="mb-4 text-sm font-medium text-amber-700">
          Live data incomplete for new charts — showing sample data until Zoho fields are wired.
        </p>
      )}
      <SampleDataBoundary
        active={usingSampleData}
        hint={
          <>
            Sync from Zoho at{" "}
            <a href="/admin" className="font-bold underline">
              /admin
            </a>
          </>
        }
      >
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Lead Source Breakdown" subtitle="Click a segment to drill down" className="lg:col-span-2">
              <LeadSourceBarChart data={rows} />
            </ChartCard>
            <ChartCard title="Total Leads Received" subtitle="Click a bar to drill down by source">
              <TotalLeadsChart data={rows} />
            </ChartCard>
            <ChartCard title="Total Registrations" subtitle="Count (bars) with conversion % (line)">
              <RegistrationsTrendChart data={rows} />
            </ChartCard>
            <ChartCard title="Lead → Registration Conversion" subtitle="Leads vs registrations with %" className="lg:col-span-2">
              <LeadConversionChart data={rows} />
            </ChartCard>
          </div>
        )}
      </SampleDataBoundary>
    </>
  );
}
