import { PageHeader } from "@/components/layout/app-shell";
import {
  LodgementTrendChart,
  PendingActionsChart,
  RefusalTrendChart,
  SubclassBreakdownChart,
} from "@/components/charts/visa-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SampleDataBoundary } from "@/components/dashboard/sample-data-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { getVisaAlerts } from "@/lib/alerts";
import { getPillarData } from "@/lib/dashboard-data";
import type { VisaLodgementRow } from "@/lib/validators/visa-lodgement";

export default async function VisaDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel } =
    await getPillarData<VisaLodgementRow>("visa_lodgement");
  const alerts = getVisaAlerts(rows);

  return (
    <>
      <PageHeader
        title="Visa Team"
        description="Lodgement pipeline — subclass breakdown and turnaround tracking"
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
      {alerts.hasRefusals && (
        <div className="liquid-glass mb-6 rounded-[1.25rem] border border-orange-200/70 bg-orange-50/80 p-4 text-sm font-bold text-f-orange shadow-[0_12px_40px_rgba(228,90,42,0.08)] backdrop-blur-xl">
          Requires immediate management review — visa refusals detected in latest data.
        </div>
      )}
      {rows.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <ChartCard
            title="Subclass Breakdown"
            subtitle="Horizontal bars sorted by volume, with share % in tooltip"
          >
            <SubclassBreakdownChart data={rows} />
          </ChartCard>
          <ChartCard
            title="Lodgement Trend"
            subtitle="Monthly lodged count — defaults to current year"
            tall
          >
            <LodgementTrendChart data={rows} />
          </ChartCard>
          <ChartCard
            title="Refusal Trend"
            subtitle="Monthly refused count — defaults to current year"
            tall
          >
            <RefusalTrendChart data={rows} />
          </ChartCard>
          <ChartCard
            title="Pending Actions by Week"
            className="lg:col-span-2"
          >
            <PendingActionsChart data={rows} />
          </ChartCard>
        </div>
      )}
      </SampleDataBoundary>
    </>
  );
}
