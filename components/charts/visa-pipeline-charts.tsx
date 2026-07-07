"use client";

import { useState } from "react";
import { Bar, BarChart } from "recharts";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { CHART_COLORS } from "@/lib/constants";
import type { VisaPipelineStatus } from "@/lib/framework/types";
import { sampleVisaTurnaroundDrilldown } from "@/lib/framework/sample-supplements";
import type { VisaLodgementRow } from "@/lib/validators/visa-lodgement";
import { ChartDrilldownPanel } from "./chart-drilldown-panel";
import {
  BAR_RADIUS,
  CHART_MARGIN,
  ChartFrame,
  ChartGrid,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
} from "./chart-theme";

export function VisaPipelineStatusGrid({ status }: { status: VisaPipelineStatus }) {
  const items = [
    { label: "Lodged this week", value: status.lodged_this_week, color: CHART_COLORS.primary },
    { label: "Total refused", value: status.total_refused, color: CHART_COLORS.alert },
    { label: "Processing", value: status.total_processing, color: CHART_COLORS.amber },
    { label: "Pending S56", value: status.pending_s56, color: CHART_COLORS.dark },
    { label: "Pending biometrics", value: status.pending_biometrics, color: CHART_COLORS.secondary },
    { label: "Pending medicals", value: status.pending_medicals, color: CHART_COLORS.muted },
    { label: "Other pending", value: status.pending_other, color: "#94A3B8" },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {item.label}
          </p>
          <p className="mt-2 text-3xl font-black" style={{ color: item.color }}>
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function TurnaroundBucketChartInner({ data }: { data: VisaLodgementRow[] }) {
  const [bucket, setBucket] = useState<string | null>(null);

  const buckets = [
    { label: "Within 7 days", min: 0, max: 7 },
    { label: "8–14 days", min: 8, max: 14 },
    { label: "15+ days", min: 15, max: Infinity },
  ];

  const chartData = buckets.map(({ label, min, max }) => ({
    label,
    count: data.filter((row) => {
      const days = row.avg_days_file_to_lodgement ?? 0;
      return days >= min && days <= max && row.lodged_count > 0;
    }).reduce((s, r) => s + r.lodged_count, 0),
  }));

  return (
    <>
      <ChartFrame>
        <BarChart data={chartData} margin={CHART_MARGIN}>
          <ChartGrid />
          <ChartXAxis dataKey="label" />
          <ChartYAxis allowDecimals={false} />
          <ChartTooltip />
          <Bar
            dataKey="count"
            name="Lodgements"
            fill={CHART_COLORS.primary}
            radius={BAR_RADIUS}
            className="cursor-pointer"
            onClick={(barData) => {
              const payload = barData as { label?: string };
              if (payload.label) setBucket(payload.label);
            }}
          />
        </BarChart>
      </ChartFrame>
      {bucket && (
        <ChartDrilldownPanel
          title="Turnaround bucket"
          subtitle={bucket}
          records={sampleVisaTurnaroundDrilldown(bucket)}
          onClose={() => setBucket(null)}
        />
      )}
    </>
  );
}

function PendingActionsBreakdownChartInner({ status }: { status: VisaPipelineStatus }) {
  const chartData = [
    { type: "S56", count: status.pending_s56 },
    { type: "Biometrics", count: status.pending_biometrics },
    { type: "Medicals", count: status.pending_medicals },
    { type: "Other", count: status.pending_other },
  ];

  return (
    <ChartFrame>
      <BarChart data={chartData} margin={CHART_MARGIN}>
        <ChartGrid />
        <ChartXAxis dataKey="type" />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip />
        <Bar dataKey="count" name="Pending" fill={CHART_COLORS.amber} radius={BAR_RADIUS} />
      </BarChart>
    </ChartFrame>
  );
}

export function TurnaroundBucketChart(props: { data: VisaLodgementRow[] }) {
  return (
    <ChartErrorBoundary>
      <TurnaroundBucketChartInner {...props} />
    </ChartErrorBoundary>
  );
}

export function PendingActionsBreakdownChart(props: { status: VisaPipelineStatus }) {
  return (
    <ChartErrorBoundary>
      <PendingActionsBreakdownChartInner {...props} />
    </ChartErrorBoundary>
  );
}
