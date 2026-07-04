import { PageHeader } from "@/components/layout/app-shell";
import { PreviewCharts } from "@/components/preview/preview-charts";

export default function PreviewPage() {
  return (
    <>
      <PageHeader
        title="Chart Preview"
        description="Live preview using sample template data — no database or upload required"
      />

      <div className="liquid-glass mb-8 rounded-[1.25rem] border border-emerald-200/60 bg-white/55 px-4 py-3 text-sm text-dark shadow-[0_12px_40px_rgba(32,201,151,0.08)] backdrop-blur-xl">
        These are the actual Recharts components from the dashboard, rendered
        with data from the CSV templates in{" "}
        <code className="font-mono text-xs">public/templates/</code>. This page
        never touches the database.
      </div>

      <PreviewCharts />
    </>
  );
}
