import Link from "next/link";
import type { RagStatus } from "@/lib/alerts";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { SummarySparkline } from "./summary-sparkline";

interface DashboardCardProps {
  title: string;
  metric: string;
  metricLabel: string;
  href: string;
  status: RagStatus;
  sparklineData: { value: number }[];
  lastUpdated?: string;
}

const statusLabels: Record<RagStatus, string> = {
  green: "On Track",
  amber: "Watch",
  red: "At Risk",
};

export function DashboardCard({
  title,
  metric,
  metricLabel,
  href,
  status,
  sparklineData,
  lastUpdated,
}: DashboardCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        "liquid-glass group block overflow-hidden rounded-[1.65rem] border border-white/70 bg-white/55 p-5 shadow-[0_20px_60px_rgba(31,42,61,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-emerald-200/80 hover:bg-white/70",
      )}
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <h3 className="text-sm font-extrabold text-slate-800">{title}</h3>
        <Badge status={status}>{statusLabels[status]}</Badge>
      </div>
      <p className="font-mono text-3xl font-black tabular-nums text-slate-950">
        {metric}
      </p>
      <p className="mt-1 text-xs font-medium text-slate-500">{metricLabel}</p>
      <div className="mt-4">
        <SummarySparkline data={sparklineData} />
      </div>
      {lastUpdated && (
        <p className="mt-3 text-xs text-slate-400">Uploaded {lastUpdated}</p>
      )}
    </Link>
  );
}
