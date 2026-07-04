"use client";

import { Area, AreaChart, Bar, BarChart, Cell } from "recharts";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CHART_COLORS } from "@/lib/constants";
import { formatMonthYear, monthKey } from "@/lib/format";
import type { VisaLodgementRow } from "@/lib/validators/visa-lodgement";
import {
  AreaGradient,
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

function SubclassBreakdownChartInner({
  data,
  loading,
}: {
  data: VisaLodgementRow[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const bySubclass = data.reduce<Record<string, number>>((acc, row) => {
    acc[row.visa_subclass] = (acc[row.visa_subclass] ?? 0) + row.lodged_count;
    return acc;
  }, {});

  const total = Object.values(bySubclass).reduce((sum, value) => sum + value, 0);

  const chartData = Object.entries(bySubclass)
    .map(([subclass, lodged]) => ({
      subclass: `Subclass ${subclass}`,
      lodged,
      share: total > 0 ? (lodged / total) * 100 : 0,
    }))
    .sort((a, b) => b.lodged - a.lodged);

  return (
    <ChartFrame>
      <BarChart data={chartData} layout="vertical" margin={{ ...CHART_MARGIN, left: 8, right: 20 }}>
        <ChartGrid vertical />
        <ChartXAxis type="number" allowDecimals={false} />
        <ChartYAxis type="category" dataKey="subclass" width={104} />
        <ChartTooltip />
        <Bar dataKey="lodged" name="Lodged" radius={BAR_RADIUS_H}>
          {chartData.map((_, index) => (
            <Cell key={index} fill={SERIES_COLORS[index % SERIES_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

function LodgementTrendChartInner({
  data,
  loading,
}: {
  data: VisaLodgementRow[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const byMonth = data.reduce<Record<string, number>>((acc, row) => {
    const key = monthKey(row.period);
    acc[key] = (acc[key] ?? 0) + row.lodged_count;
    return acc;
  }, {});

  const chartData = Object.entries(byMonth)
    .map(([key, lodged]) => ({
      monthKey: key,
      period: formatMonthYear(new Date(`${key}-01T00:00:00`)),
      lodged,
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  return (
    <ChartFrame>
      <AreaChart data={chartData} margin={{ ...CHART_MARGIN, bottom: 8 }}>
        <AreaGradient id="visaLodged" color={CHART_COLORS.primary} />
        <ChartGrid />
        <ChartXAxis dataKey="period" interval="preserveStartEnd" minTickGap={28} />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip />
        <Area
          type="monotone"
          dataKey="lodged"
          name="Lodged"
          stroke={CHART_COLORS.primary}
          strokeWidth={4}
          fill="url(#visaLodged)"
          dot={{ ...LINE_PROPS.dot, fill: CHART_COLORS.primary }}
          activeDot={LINE_PROPS.activeDot}
        />
      </AreaChart>
    </ChartFrame>
  );
}

function PendingActionsChartInner({
  data,
  loading,
}: {
  data: VisaLodgementRow[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const byMonth = data.reduce<Record<string, number>>((acc, row) => {
    const key = monthKey(row.period);
    acc[key] = (acc[key] ?? 0) + row.pending_actions_count;
    return acc;
  }, {});

  const chartData = Object.entries(byMonth)
    .map(([key, pending]) => ({
      monthKey: key,
      period: formatMonthYear(new Date(`${key}-01T00:00:00`)),
      pending,
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey))
    .filter((row) => row.pending > 0);

  if (chartData.length === 0) {
    return <EmptyState message="No pending actions in the current data" />;
  }

  return (
    <ChartFrame>
      <BarChart data={chartData} margin={{ ...CHART_MARGIN, bottom: 8 }} barCategoryGap="24%">
        <ChartGrid />
        <ChartXAxis dataKey="period" interval="preserveStartEnd" minTickGap={28} />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip />
        <Bar dataKey="pending" name="Pending Actions" fill={CHART_COLORS.alert} radius={BAR_RADIUS} />
      </BarChart>
    </ChartFrame>
  );
}

export function SubclassBreakdownChart(props: { data: VisaLodgementRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><SubclassBreakdownChartInner {...props} /></ChartErrorBoundary>;
}

export function LodgementTrendChart(props: { data: VisaLodgementRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><LodgementTrendChartInner {...props} /></ChartErrorBoundary>;
}

export function PendingActionsChart(props: { data: VisaLodgementRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><PendingActionsChartInner {...props} /></ChartErrorBoundary>;
}
