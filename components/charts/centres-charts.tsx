"use client";

import { Bar, BarChart, Line, LineChart } from "recharts";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CHART_COLORS } from "@/lib/constants";
import { formatMonthYear, monthKey } from "@/lib/format";
import type { StudyCentresRow } from "@/lib/validators/study-centres";
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
  sortByDate,
} from "./chart-theme";

const BRANCH_COLORS: Record<string, string> = {
  Lautoka: CHART_COLORS.primary,
  "Port Moresby": CHART_COLORS.secondary,
  Lae: CHART_COLORS.alert,
};

function BranchComparisonChartInner({ data, loading }: { data: StudyCentresRow[]; loading?: boolean }) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const sorted = sortByDate(data, (row) => row.period);
  const latestPeriod = sorted.at(-1)?.period;
  const latest = sorted.filter(
    (row) => new Date(row.period).getTime() === new Date(latestPeriod!).getTime(),
  );

  const chartData = latest.map((row) => ({
    branch: row.branch,
    registrations: row.new_registrations_local,
    offers: row.offer_letters_issued,
  }));

  return (
    <ChartFrame>
      <BarChart data={chartData} margin={CHART_MARGIN} barGap={4} barCategoryGap="24%">
        <ChartGrid />
        <ChartXAxis dataKey="branch" />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip />
        <ChartLegend />
        <Bar dataKey="registrations" name="Registrations" fill={CHART_COLORS.primary} radius={BAR_RADIUS} barSize={22} />
        <Bar dataKey="offers" name="Offer Letters" fill={CHART_COLORS.alert} radius={BAR_RADIUS} barSize={22} />
      </BarChart>
    </ChartFrame>
  );
}

function ActiveStudentsTrendChartInner({ data, loading }: { data: StudyCentresRow[]; loading?: boolean }) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const byMonth = data.reduce<Record<string, StudyCentresRow[]>>((acc, row) => {
    const key = monthKey(row.period);
    acc[key] = acc[key] ?? [];
    acc[key].push(row);
    return acc;
  }, {});

  const chartData = Object.entries(byMonth)
    .map(([key, rows]) => {
      const entry: Record<string, string | number> = {
        monthKey: key,
        period: formatMonthYear(new Date(`${key}-01T00:00:00`)),
      };
      for (const row of rows) {
        entry[row.branch] = row.active_year1_students;
      }
      return entry;
    })
    .sort((a, b) => String(a.monthKey).localeCompare(String(b.monthKey)));

  return (
    <ChartFrame>
      <LineChart data={chartData} margin={CHART_MARGIN}>
        <ChartGrid />
        <ChartXAxis dataKey="period" interval="preserveStartEnd" minTickGap={24} />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip />
        <ChartLegend />
        {Object.keys(BRANCH_COLORS).map((branch) => (
          <Line
            key={branch}
            {...LINE_PROPS}
            dataKey={branch}
            name={branch}
            stroke={BRANCH_COLORS[branch]}
            dot={{ ...LINE_PROPS.dot, fill: BRANCH_COLORS[branch] }}
          />
        ))}
      </LineChart>
    </ChartFrame>
  );
}

function AustraliaPipelineChartInner({ data, loading }: { data: StudyCentresRow[]; loading?: boolean }) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const totals = data.reduce(
    (acc, row) => {
      acc.local += row.followon_year2_year3_local;
      acc.australia += row.followon_year2_year3_australia;
      return acc;
    },
    { local: 0, australia: 0 },
  );

  const chartData = [
    { stage: "Y2/Y3 Local", count: totals.local },
    { stage: "Y2/Y3 Australia", count: totals.australia },
  ];

  return (
    <ChartFrame>
      <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="32%">
        <ChartGrid />
        <ChartXAxis dataKey="stage" />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip />
        <Bar dataKey="count" name="Students" fill={CHART_COLORS.dark} radius={BAR_RADIUS} />
      </BarChart>
    </ChartFrame>
  );
}

export function BranchComparisonChart(props: { data: StudyCentresRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><BranchComparisonChartInner {...props} /></ChartErrorBoundary>;
}

export function ActiveStudentsTrendChart(props: { data: StudyCentresRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><ActiveStudentsTrendChartInner {...props} /></ChartErrorBoundary>;
}

export function AustraliaPipelineChart(props: { data: StudyCentresRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><AustraliaPipelineChartInner {...props} /></ChartErrorBoundary>;
}
