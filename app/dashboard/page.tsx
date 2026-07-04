import { PageHeader } from "@/components/layout/app-shell";
import { AlertTray } from "@/components/dashboard/alert-tray";
import { DashboardCard } from "@/components/dashboard/dashboard-card";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { EmptyState } from "@/components/ui/empty-state";
import { getSessionUser, isDemoMode } from "@/lib/auth";
import { getDashboardOverview } from "@/lib/dashboard-data";

export default async function DashboardPage() {
  const [overview, user] = await Promise.all([
    getDashboardOverview(),
    getSessionUser(),
  ]);

  return (
    <>
      <PageHeader
        title="Mission Control"
        description="Single Source of Truth — all six reporting pillars at a glance"
      />

      {isDemoMode() && <DemoBanner />}

      {!overview.hasDatabase && !overview.usingSampleData && (
        <div className="liquid-glass mb-6 rounded-[1.25rem] border border-amber-200/70 bg-amber-50/80 p-4 text-sm text-amber-900 shadow-[0_12px_40px_rgba(246,162,11,0.08)] backdrop-blur-xl">
          Database not configured. Add your <code className="font-mono">DATABASE_URL</code> to{" "}
          <code className="font-mono">.env.local</code> and run{" "}
          <code className="font-mono">npm run db:push</code>.
        </div>
      )}
      {overview.usingSampleData && (
        <div className="liquid-glass mb-6 rounded-[1.25rem] border border-emerald-200/60 bg-white/55 px-4 py-3 text-sm text-dark shadow-[0_12px_40px_rgba(32,201,151,0.08)] backdrop-blur-xl">
          Showing sample data — upload live reports at{" "}
          <a href="/upload" className="font-bold text-emerald-700 underline">
            /upload
          </a>{" "}
          or view all charts on{" "}
          <a href="/preview" className="font-bold text-emerald-700 underline">
            /preview
          </a>
          .
        </div>
      )}

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
    </>
  );
}
