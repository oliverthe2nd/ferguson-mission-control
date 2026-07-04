import { PageHeader } from "@/components/layout/app-shell";
import { SampleDataOverlay } from "@/components/dashboard/sample-data-overlay";
import { PreviewCharts } from "@/components/preview/preview-charts";

export default function PreviewPage() {
  return (
    <>
      <PageHeader
        title="Chart Preview"
        description="Live preview using sample template data — no database or upload required"
      />

      <SampleDataOverlay hint="Template CSV data only — not connected to live uploads.">
        <PreviewCharts />
      </SampleDataOverlay>
    </>
  );
}
