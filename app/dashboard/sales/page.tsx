import { SalesPipelineDashboard } from "@/components/dashboard/sales-pipeline-dashboard";
import { DashboardReportSection } from "@/components/dashboard/dashboard-report-section";
import { SampleDataBoundary } from "@/components/dashboard/sample-data-overlay";
import { getResolvedPillarData } from "@/lib/framework/pillar-resolve";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";

export default async function SalesDashboardPage() {
  const { rows, hasDatabase, usingSampleData, lastUploadLabel, forcedSampleFallback } =
    await getResolvedPillarData<SalesPipelineRow>("sales_pipeline");

  return (
    <DashboardReportSection
      title="Sales & Marketing"
      description="Pipeline conversion across Standard, Study Centre, and YESSFUND"
      lastUploadLabel={!usingSampleData ? lastUploadLabel : null}
    >
      {!hasDatabase && !usingSampleData && (
        <p className="text-sm font-medium text-amber-700">Database not configured.</p>
      )}
      {forcedSampleFallback && (
        <p className="text-sm font-medium text-amber-700">
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
        <SalesPipelineDashboard rows={rows} />
      </SampleDataBoundary>
    </DashboardReportSection>
  );
}
