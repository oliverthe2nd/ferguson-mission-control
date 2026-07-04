import { PageHeader } from "@/components/layout/app-shell";
import {
  AvgDaysTrendChart,
  ConversionTrendChart,
  LeadSourceBarChart,
} from "@/components/charts/sales-pipeline-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { EmptyState } from "@/components/ui/empty-state";
import { getPillarData } from "@/lib/dashboard-data";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";

export default async function SalesDashboardPage() {
  const { rows, hasDatabase, usingSampleData } = await getPillarData<SalesPipelineRow>("sales_pipeline");

  return (
    <>
      <PageHeader
        title="Sales & Marketing"
        description="Pipeline conversion — weekly lead source and conversion tracking"
      />
      {!hasDatabase && !usingSampleData && (
        <p className="mb-4 text-sm font-medium text-amber-700">Database not configured.</p>
      )}
      {usingSampleData && (
        <div className="liquid-glass mb-6 rounded-[1.25rem] border border-emerald-200/60 bg-white/55 px-4 py-3 text-sm text-dark shadow-[0_12px_40px_rgba(32,201,151,0.08)] backdrop-blur-xl">
          Showing sample template data. Upload live reports at{" "}
          <a href="/upload" className="font-bold text-emerald-700 underline">
            /upload
          </a>
          .
        </div>
      )}
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
    </>
  );
}
