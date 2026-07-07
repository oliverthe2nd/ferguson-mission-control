import { AlertTray } from "@/components/dashboard/alert-tray";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DashboardReportSection } from "@/components/dashboard/dashboard-report-section";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { SampleDataBoundary } from "@/components/dashboard/sample-data-overlay";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionUser, isDemoMode } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const [overview, user] = await Promise.all([
    getDashboardOverview(),
    getSessionUser(),
  ]);

  return (
    <DashboardReportSection
      title="Mission Control"
      description="Single Source of Truth — all six reporting pillars at a glance"
    >
      {isDemoMode() && <DemoBanner />}

      {overview.usingSampleData ? null : !overview.hasDatabase ? (
        <div className="liquid-glass rounded-[1.25rem] border border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-[0_12px_40px_rgba(246,162,11,0.08)] backdrop-blur-xl">
          Database not configured. Add your <code className="font-mono">DATABASE_URL</code> to{" "}
          <code className="font-mono">.env.local</code> and run{" "}
          <code className="font-mono">npm run db:push</code>.
        </div>
      ) : null}

      <SampleDataBoundary
        active={overview.usingSampleData}
        hint={
          <>
            Upload live reports at{" "}
            <a href="/upload" className="font-bold underline">
              /upload
            </a>
          </>
        }
      >
        <AlertTray alerts={overview.alerts} />

        {overview.cards.length === 0 ? (
          <EmptyState showUploadLink={user?.role === "admin"} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {overview.cards.map((card) => (
              <DashboardCard key={card.title} {...card} />
            ))}
          </div>
        )}
      </SampleDataBoundary>
    </DashboardReportSection>
  );
}
