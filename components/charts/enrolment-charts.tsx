"use client";

import { Bar, BarChart, Cell, Label, LabelList, Legend, Pie, PieChart, ReferenceLine } from "recharts";
import { useState } from "react";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { isStudentAtRisk } from "@/lib/alerts";
import { getMilestoneActual, getMilestoneTarget } from "@/lib/enrolment-dates";
import { ENROLMENT_FEE_MILESTONES } from "@/lib/enrolment-fees";
import { CHART_COLORS } from "@/lib/constants";
import { sampleEnrolmentMonthDrilldown } from "@/lib/framework/sample-supplements";
import { formatMonthYear, monthKey } from "@/lib/format";
import type { EnrolmentMilestoneRow } from "@/lib/validators/enrolment-milestones";
import { ChartDrilldownPanel } from "./chart-drilldown-panel";
import {
  BAR_RADIUS,
  BAR_RADIUS_H,
  CHART_MARGIN,
  ChartFrame,
  ChartGrid,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
} from "./chart-theme";

function AtRiskCenterLabel({
  viewBox,
  total,
}: {
  viewBox?: { cx?: number; cy?: number } | null;
  total: number;
}) {
  if (viewBox?.cx == null || viewBox?.cy == null) return null;

  return (
    <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
      <tspan
        x={viewBox.cx}
        y={viewBox.cy - 6}
        fill={CHART_COLORS.dark}
        fontSize={28}
        fontWeight={800}
      >
        {total}
      </tspan>
      <tspan
        x={viewBox.cx}
        y={viewBox.cy + 16}
        fill={CHART_COLORS.muted}
        fontSize={11}
        fontWeight={600}
      >
        Enrolments
      </tspan>
    </text>
  );
}

import { ENROLMENT_FEE_MILESTONES } from "@/lib/enrolment-fees";

const MILESTONES = ENROLMENT_FEE_MILESTONES.map(({ key, label }) => ({ key, label }));

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
    const completed = data.filter((row) => getMilestoneActual(row, key) !== null).length;
    return { stage: label, completed };
  });

  return (
    <ChartFrame>
      <BarChart data={chartData} layout="vertical" margin={{ ...CHART_MARGIN, left: 8 }}>
        <ChartGrid vertical />
        <ChartXAxis type="number" allowDecimals={false} />
        <ChartYAxis type="category" dataKey="stage" width={118} tick={{ fontSize: 11 }} />
        <ChartTooltip />
        <Bar
          dataKey="completed"
          name="Completed"
          fill={CHART_COLORS.primary}
          radius={BAR_RADIUS_H}
        />
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
  const onTrackCount = data.length - atRiskCount;
  const chartData = [
    { label: "On Track", count: onTrackCount, color: CHART_COLORS.primary },
    { label: "AT RISK", count: atRiskCount, color: CHART_COLORS.alert },
  ].filter((entry) => entry.count > 0);

  return (
    <ChartFrame>
      <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <ChartTooltip
          valueFormatter={(value) =>
            `${value} student${value === 1 ? "" : "s"}`
          }
        />
        <Pie
          data={chartData}
          dataKey="count"
          nameKey="label"
          cx="50%"
          cy="46%"
          innerRadius={62}
          outerRadius={96}
          paddingAngle={chartData.length > 1 ? 3 : 0}
          stroke="#fff"
          strokeWidth={3}
        >
          {chartData.map((entry) => (
            <Cell key={entry.label} fill={entry.color} />
          ))}
          <Label
            content={(props) => (
              <AtRiskCenterLabel
                viewBox={props.viewBox as { cx?: number; cy?: number } | undefined}
                total={data.length}
              />
            )}
            position="center"
          />
        </Pie>
        <Legend
          verticalAlign="bottom"
          content={() => (
            <div className="flex justify-center gap-6 pt-1 text-xs font-bold text-slate-600">
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS.primary }}
                />
                On Track: {onTrackCount}
              </span>
              <span className="inline-flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: CHART_COLORS.alert }}
                />
                AT RISK: {atRiskCount}
              </span>
            </div>
          )}
        />
      </PieChart>
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
      const target = getMilestoneTarget(row, key);
      const actual = getMilestoneActual(row, key);
      if (actual && target) {
        const diff =
          (actual.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
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
  const xMax = barMax === 0 ? 10 : Math.ceil(barMax * 1.12);

  const formatDays = (value: number) => {
    const n = Number.isInteger(value) ? value : Number(value.toFixed(1));
    return n.toLocaleString("en-AU", { maximumFractionDigits: 1 });
  };

  return (
    <ChartFrame>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ ...CHART_MARGIN, left: 8, right: 48, bottom: 28 }}
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
            position="right"
            offset={6}
            formatter={(value) => formatDays(Number(value))}
            style={{
              fill: CHART_COLORS.dark,
              fontSize: 11,
              fontWeight: 700,
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

function EnrolmentMonthlyChartInner({
  data,
  loading,
}: {
  data: EnrolmentMilestoneRow[];
  loading?: boolean;
}) {
  const [month, setMonth] = useState<string | null>(null);

  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const byMonth = new Map<string, number>();
  for (const row of data) {
    if (!row.registration_date) continue;
    const key = monthKey(row.registration_date);
    byMonth.set(key, (byMonth.get(key) ?? 0) + 1);
  }

  const chartData = [...byMonth.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, count]) => ({
      monthKey: key,
      month: formatMonthYear(new Date(`${key}-01`)),
      count,
    }));

  return (
    <>
      <ChartFrame>
        <BarChart data={chartData} margin={CHART_MARGIN}>
          <ChartGrid />
          <ChartXAxis dataKey="month" />
          <ChartYAxis allowDecimals={false} />
          <ChartTooltip />
          <Bar
            dataKey="count"
            name="Registrations"
            fill={CHART_COLORS.primary}
            radius={BAR_RADIUS}
            className="cursor-pointer"
            onClick={(barData) => {
              const payload = barData as { month?: string };
              if (payload.month) setMonth(payload.month);
            }}
          />
        </BarChart>
      </ChartFrame>
      {month && (
        <ChartDrilldownPanel
          title="Enrolments"
          subtitle={month}
          records={sampleEnrolmentMonthDrilldown(month)}
          onClose={() => setMonth(null)}
        />
      )}
    </>
  );
}

export function EnrolmentMonthlyChart(props: { data: EnrolmentMilestoneRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><EnrolmentMonthlyChartInner {...props} /></ChartErrorBoundary>;
}
