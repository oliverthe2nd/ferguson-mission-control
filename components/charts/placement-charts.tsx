"use client";

import { Bar, BarChart, Cell, ComposedChart, Line } from "recharts";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CHART_COLORS } from "@/lib/constants";
import { formatAud, formatMonthYear } from "@/lib/format";
import type { JobPlacementRow } from "@/lib/validators/job-placement";
import {
  BAR_RADIUS,
  CHART_MARGIN,
  ChartFrame,
  ChartGrid,
  ChartLegend,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
  LINE_PROPS,
  SERIES_COLORS,
  sortByDate,
} from "./chart-theme";

function PlacementFunnelChartInner({ data, loading }: { data: JobPlacementRow[]; loading?: boolean }) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const latest = sortByDate(data, (row) => row.period).at(-1)!;
  const chartData = [
    { stage: "Arrivals", count: latest.visa_approved_arrivals, color: SERIES_COLORS[0] },
    { stage: "Settled", count: latest.settlement_assisted_count, color: SERIES_COLORS[1] },
    { stage: "Placed", count: latest.successfully_placed_jobs, color: SERIES_COLORS[2] },
  ];

  return (
    <ChartFrame>
      <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="28%">
        <ChartGrid />
        <ChartXAxis dataKey="stage" />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip />
        <Bar dataKey="count" name="Count" radius={BAR_RADIUS}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

function TestimonialBreakdownChartInner({ data, loading }: { data: JobPlacementRow[]; loading?: boolean }) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const latest = sortByDate(data, (row) => row.period).at(-1)!;
  const chartData = [
    { type: "Post-arrival", count: latest.testimonial1_count, color: CHART_COLORS.primary },
    { type: "Written", count: latest.testimonial2_written_count, color: CHART_COLORS.secondary },
    { type: "Video", count: latest.testimonial2_video_count, color: CHART_COLORS.alert },
  ];

  return (
    <ChartFrame>
      <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="28%">
        <ChartGrid />
        <ChartXAxis dataKey="type" />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip />
        <Bar dataKey="count" name="Count" radius={BAR_RADIUS}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

function IncentivesVsPlacementsChartInner({ data, loading }: { data: JobPlacementRow[]; loading?: boolean }) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const chartData = sortByDate(data, (row) => row.period).map((row) => ({
    period: formatMonthYear(row.period),
    placements: row.successfully_placed_jobs,
    incentives: row.incentives_paid_total,
  }));

  return (
    <ChartFrame>
      <ComposedChart data={chartData} margin={CHART_MARGIN}>
        <ChartGrid />
        <ChartXAxis dataKey="period" />
        <ChartYAxis yAxisId="left" allowDecimals={false} />
        <ChartYAxis
          yAxisId="right"
          orientation="right"
          tickFormatter={(v) => formatAud(v)}
          width={72}
        />
        <ChartTooltip
          valueFormatter={(v, name) =>
            name.includes("Incentive") ? formatAud(v) : String(v)
          }
        />
        <ChartLegend />
        <Bar
          yAxisId="left"
          dataKey="placements"
          name="Placements"
          fill={CHART_COLORS.primary}
          radius={BAR_RADIUS}
          barSize={28}
        />
        <Line
          yAxisId="right"
          {...LINE_PROPS}
          dataKey="incentives"
          name="Incentives (AUD)"
          stroke={CHART_COLORS.alert}
          dot={{ ...LINE_PROPS.dot, fill: CHART_COLORS.alert }}
        />
      </ComposedChart>
    </ChartFrame>
  );
}

export function PlacementFunnelChart(props: { data: JobPlacementRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><PlacementFunnelChartInner {...props} /></ChartErrorBoundary>;
}

export function TestimonialBreakdownChart(props: { data: JobPlacementRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><TestimonialBreakdownChartInner {...props} /></ChartErrorBoundary>;
}

export function IncentivesVsPlacementsChart(props: { data: JobPlacementRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><IncentivesVsPlacementsChartInner {...props} /></ChartErrorBoundary>;
}
