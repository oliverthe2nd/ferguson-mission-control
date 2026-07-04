"use client";

import type { ReactNode } from "react";
import { LineChart as LineChartIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
  tall?: boolean;
  /** Use for tables or content that should not be fixed to chart height */
  fill?: boolean;
}

export function ChartCard({
  title,
  subtitle,
  children,
  className,
  tall = false,
  fill = false,
}: ChartCardProps) {
  return (
    <section
      className={cn(
        "liquid-glass group relative overflow-hidden rounded-[1.65rem] border border-white/70 bg-white/55 p-5 shadow-[0_20px_60px_rgba(31,42,61,0.10),inset_0_1px_0_rgba(255,255,255,0.95)] backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-emerald-200/80 hover:bg-white/70 hover:shadow-[0_30px_80px_rgba(31,42,61,0.14),inset_0_1px_0_rgba(255,255,255,1)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-emerald-300/20 blur-3xl transition duration-500 group-hover:bg-emerald-300/30" />
      <div className="pointer-events-none absolute -bottom-24 left-10 h-44 w-44 rounded-full bg-orange-200/20 blur-3xl" />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-white/95" />
      <div className="relative mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold tracking-tight text-slate-900">
            {title}
          </h2>
          {subtitle && (
            <p className="mt-1 text-sm font-medium text-slate-500">{subtitle}</p>
          )}
        </div>
        <div className="rounded-full border border-white/80 bg-white/50 p-2 text-emerald-600 shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_8px_20px_rgba(32,201,151,0.16)] backdrop-blur-xl ring-1 ring-emerald-100/60">
          <LineChartIcon className="h-4 w-4" />
        </div>
      </div>
      <div
        className={cn(
          "relative",
          !fill && "h-[270px]",
          !fill && tall && "h-[330px]",
        )}
      >
        {children}
      </div>
    </section>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
        {title}
      </h2>
      {children}
    </section>
  );
}
