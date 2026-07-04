import { cn } from "@/lib/utils";

export function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={cn("shimmer rounded-xl bg-slate-200/80", className)}
      aria-hidden
    />
  );
}

function ChartCardSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="liquid-glass rounded-[1.65rem] border border-white/70 bg-white/55 p-5 shadow-[0_20px_60px_rgba(31,42,61,0.10)] backdrop-blur-2xl">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div className="flex-1 space-y-2">
          <Shimmer className="h-4 w-2/5" />
          <Shimmer className="h-3 w-3/5" />
        </div>
        <Shimmer className="h-8 w-8 rounded-full" />
      </div>
      <Shimmer className={cn("w-full", tall ? "h-[250px]" : "h-[220px]")} />
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6 space-y-3">
      <Shimmer className="h-9 w-56 sm:w-72" />
      <Shimmer className="h-4 w-full max-w-xl" />
      <Shimmer className="h-3 w-48" />
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="liquid-glass rounded-[1.65rem] border border-white/70 bg-white/55 p-5 backdrop-blur-2xl"
          >
            <div className="mb-3 flex items-start justify-between">
              <Shimmer className="h-4 w-28" />
              <Shimmer className="h-5 w-16 rounded-full" />
            </div>
            <Shimmer className="h-9 w-24" />
            <Shimmer className="mt-2 h-3 w-36" />
            <Shimmer className="mt-4 h-12 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function DashboardChartsSkeleton({
  columns = 2,
  chartCount = 3,
  tallIndex,
  withTable = false,
}: {
  columns?: 2 | 3;
  chartCount?: number;
  tallIndex?: number;
  withTable?: boolean;
}) {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div
        className={cn(
          "grid gap-6",
          columns === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2",
        )}
      >
        {Array.from({ length: chartCount }).map((_, index) => (
          <div
            key={index}
            className={cn(
              chartCount === 3 && index === 0 && columns === 2 && "lg:col-span-2",
              chartCount === 3 && index === 2 && columns === 2 && "lg:col-span-2",
            )}
          >
            <ChartCardSkeleton tall={tallIndex === index} />
          </div>
        ))}
      </div>
      {withTable ? (
        <div className="liquid-glass rounded-[1.65rem] border border-white/70 bg-white/55 p-5 backdrop-blur-2xl">
          <Shimmer className="mb-4 h-5 w-40" />
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, index) => (
              <Shimmer key={index} className="h-9 w-full" />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function DashboardPageLoader({ label = "Loading dashboard" }: { label?: string }) {
  return (
    <div className="relative" aria-busy="true" aria-live="polite">
      <div className="mb-6 flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
        </span>
        <p className="text-sm font-semibold text-slate-500">{label}</p>
      </div>
      <DashboardChartsSkeleton columns={2} chartCount={3} tallIndex={1} />
    </div>
  );
}
