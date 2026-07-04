"use client";

import { Bar, BarChart, Cell, Line, LineChart } from "recharts";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { isStudentAtRisk } from "@/lib/alerts";
import { CHART_COLORS } from "@/lib/constants";
import type { EnrolmentMilestoneRow } from "@/lib/validators/enrolment-milestones";
import {
  BAR_RADIUS,
  BAR_RADIUS_H,
  CHART_MARGIN,
  ChartFrame,
  ChartGrid,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
  LINE_PROPS,
  SERIES_COLORS,
} from "./chart-theme";

const MILESTONES = [
  { key: "m1", label: "M1 Consultation" },
  { key: "m2", label: "M2 Tuition" },
  { key: "m3", label: "M3 Visa Lodge" },
  { key: "m4", label: "M4 OSHC" },
  { key: "m5", label: "M5 Final Consult" },
] as const;

function MilestoneFunnelChartInner({
  data,
  loading,
}: {
  data: EnrolmentMilestoneRow[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const chartData = MILESTONES.map(({ key, label }) => {
    const completed = data.filter(
      (row) => row[`${key}_actual` as keyof EnrolmentMilestoneRow] !== null,
    ).length;
    return { stage: label, completed, total: data.length };
  });

  return (
    <ChartFrame>
      <BarChart data={chartData} layout="vertical" margin={{ ...CHART_MARGIN, left: 8 }}>
        <ChartGrid vertical />
        <ChartXAxis type="number" allowDecimals={false} />
        <ChartYAxis type="category" dataKey="stage" width={118} tick={{ fontSize: 11 }} />
        <ChartTooltip />
        <Bar dataKey="completed" name="Completed" fill={CHART_COLORS.primary} radius={BAR_RADIUS_H} />
      </BarChart>
    </ChartFrame>
  );
}

function AtRiskTrendChartInner({
  data,
  loading,
}: {
  data: EnrolmentMilestoneRow[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const atRiskCount = data.filter((row) => isStudentAtRisk(row)).length;
  const chartData = [
    { label: "Total Students", count: data.length, color: SERIES_COLORS[3] },
    { label: "AT RISK", count: atRiskCount, color: CHART_COLORS.alert },
    { label: "On Track", count: data.length - atRiskCount, color: CHART_COLORS.primary },
  ];

  return (
    <ChartFrame>
      <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="28%">
        <ChartGrid />
        <ChartXAxis dataKey="label" />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip />
        <Bar dataKey="count" name="Students" radius={BAR_RADIUS}>
          {chartData.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

function AvgDaysPerStageChartInner({
  data,
  loading,
}: {
  data: EnrolmentMilestoneRow[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const chartData = MILESTONES.map(({ key, label }) => {
    const days: number[] = [];
    for (const row of data) {
      const target = row[`${key}_target` as keyof EnrolmentMilestoneRow];
      const actual = row[`${key}_actual` as keyof EnrolmentMilestoneRow];
      if (actual && target) {
        const diff =
          (new Date(String(actual)).getTime() -
            new Date(String(target)).getTime()) /
          (1000 * 60 * 60 * 24);
        days.push(Math.abs(diff));
      }
    }
    const avg = days.length > 0 ? days.reduce((a, b) => a + b, 0) / days.length : 0;
    return { stage: label, avgDays: Number(avg.toFixed(1)) };
  });

  return (
    <ChartFrame>
      <LineChart data={chartData} margin={CHART_MARGIN}>
        <ChartGrid />
        <ChartXAxis dataKey="stage" interval={0} angle={-12} textAnchor="end" height={56} />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip valueFormatter={(v) => `${v} days`} />
        <Line
          {...LINE_PROPS}
          dataKey="avgDays"
          name="Avg Days"
          stroke={CHART_COLORS.secondary}
          dot={{ ...LINE_PROPS.dot, fill: CHART_COLORS.secondary }}
        />
      </LineChart>
    </ChartFrame>
  );
}

export function MilestoneFunnelChart(props: { data: EnrolmentMilestoneRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><MilestoneFunnelChartInner {...props} /></ChartErrorBoundary>;
}

export function AtRiskTrendChart(props: { data: EnrolmentMilestoneRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><AtRiskTrendChartInner {...props} /></ChartErrorBoundary>;
}

export function AvgDaysPerStageChart(props: { data: EnrolmentMilestoneRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><AvgDaysPerStageChartInner {...props} /></ChartErrorBoundary>;
}
