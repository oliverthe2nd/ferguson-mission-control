"use client";

import { Bar, BarChart, Cell, LabelList, ReferenceLine } from "recharts";
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

  const overallAvg =
    chartData.length > 0
      ? chartData.reduce((sum, row) => sum + row.avgDays, 0) / chartData.length
      : 0;
  const barMax = Math.max(...chartData.map((row) => row.avgDays), 0);
  const xMax = barMax === 0 ? 10 : Math.ceil(barMax * 1.08);

  const formatDays = (value: number) => {
    const n = Number.isInteger(value) ? value : Number(value.toFixed(1));
    return n.toLocaleString("en-AU", { maximumFractionDigits: 1 });
  };

  return (
    <ChartFrame>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ ...CHART_MARGIN, left: 8, right: 4, bottom: 28 }}
        barCategoryGap="22%"
      >
        <ChartGrid vertical />
        <ChartXAxis
          type="number"
          allowDecimals={false}
          domain={[0, xMax]}
          tickFormatter={(v) => formatDays(v)}
          label={{
            value: "Days",
            position: "bottom",
            offset: 0,
            style: {
              fill: CHART_COLORS.muted,
              fontSize: 11,
              fontWeight: 600,
            },
          }}
        />
        <ChartYAxis
          type="category"
          dataKey="stage"
          width={118}
          tick={{ fontSize: 11 }}
        />
        <ChartTooltip valueFormatter={(v) => `${formatDays(v)} days`} />
        <ReferenceLine
          x={overallAvg}
          stroke={CHART_COLORS.muted}
          strokeDasharray="6 4"
          strokeWidth={2}
          label={{
            value: `Avg ${formatDays(overallAvg)}`,
            position: "insideTopLeft",
            fill: CHART_COLORS.muted,
            fontSize: 10,
            fontWeight: 700,
          }}
        />
        <Bar
          dataKey="avgDays"
          name="Days"
          fill={CHART_COLORS.primary}
          radius={BAR_RADIUS_H}
        >
          <LabelList
            dataKey="avgDays"
            position="insideRight"
            offset={-10}
            formatter={(value) => formatDays(Number(value))}
            style={{
              fill: "#fff",
              fontSize: 11,
              fontWeight: 700,
              textShadow: "0 1px 2px rgba(31,42,61,0.35)",
            }}
          />
        </Bar>
      </BarChart>
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
