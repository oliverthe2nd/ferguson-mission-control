import { PageHeader } from "@/components/layout/app-shell";
import {
  LodgementTrendChart,
  PendingActionsChart,
  RefusalTrendChart,
  SubclassBreakdownChart,
} from "@/components/charts/visa-charts";
import {
  PendingActionsBreakdownChart,
  TurnaroundBucketChart,
  VisaPipelineStatusGrid,
} from "@/components/charts/visa-pipeline-charts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { SampleDataBoundary } from "@/components/dashboard/sample-data-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { getVisaAlerts } from "@/lib/alerts";
import { getResolvedPillarData, resolveVisaPipelineStatus } from "@/lib/framework/pillar-resolve";
import type { VisaLodgementRow } from "@/lib/validators/visa-lodgement";

export default async function VisaDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel, forcedSampleFallback } =
    await getResolvedPillarData<VisaLodgementRow>("visa_lodgement");
  const alerts = getVisaAlerts(rows);
  const { status: pipelineStatus } = resolveVisaPipelineStatus(rows, usingSampleData);

  return (
    <>
      <PageHeader
        title="Visa Team"
        description="Lodgement pipeline — turnaround and pending actions"
        lastUploadLabel={!usingSampleData ? lastUploadLabel : null}
      />
      {!hasDatabase && !usingSampleData && (
        <p className="mb-4 text-sm font-medium text-amber-700">Database not configured.</p>
      )}
      {forcedSampleFallback && (
        <p className="mb-4 text-sm font-medium text-amber-700">
          Live visa data missing pipeline fields — showing sample until Rose consolidates pending-action data.
        </p>
      )}
      <SampleDataBoundary active={usingSampleData} hint="Upload or data entry at /data-entry">
        {alerts.hasRefusals && (
          <div className="liquid-glass mb-6 rounded-[1.25rem] border border-orange-200/70 bg-orange-50/80 p-4 text-sm font-bold text-f-orange">
            Requires immediate management review — visa refusals detected.
          </div>
        )}
        {rows.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="space-y-6">
            <ChartCard title="Current Status Pipeline" fill>
              <VisaPipelineStatusGrid status={pipelineStatus} />
            </ChartCard>
            <div className="grid gap-6 lg:grid-cols-2">
              <ChartCard title="Lodgement Turnaround" subtitle="Click a bucket to see files">
                <TurnaroundBucketChart data={rows} />
              </ChartCard>
              <ChartCard title="Pending Actions by Type" subtitle="S56 · biometrics · medicals">
                <PendingActionsBreakdownChart status={pipelineStatus} />
              </ChartCard>
              <ChartCard title="Subclass Breakdown">
                <SubclassBreakdownChart data={rows} />
              </ChartCard>
              <ChartCard title="Lodgement Trend" tall>
                <LodgementTrendChart data={rows} />
              </ChartCard>
              <ChartCard title="Refusal Trend" tall>
                <RefusalTrendChart data={rows} />
              </ChartCard>
              <ChartCard title="Pending Actions by Week" className="lg:col-span-2">
                <PendingActionsChart data={rows} />
              </ChartCard>
            </div>
          </div>
        )}
      </SampleDataBoundary>
    </>
  );
}
