"use client";

import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, Bar, BarChart, Cell } from "recharts";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CHART_COLORS } from "@/lib/constants";
import { monthKey, monthLabelFromKey } from "@/lib/format";
import type { VisaLodgementRow } from "@/lib/validators/visa-lodgement";
import { cn } from "@/lib/utils";
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
  AXIS_TICK,
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
    acc[row.visa_subclass] = (acc[row.visa_subclass] ?? 0) + (Number(row.lodged_count) || 0);
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

function aggregateLodgedByMonth(rows: VisaLodgementRow[]) {
  const byMonth = rows.reduce<Record<string, number>>((acc, row) => {
    const key = monthKey(row.period);
    if (key === "unknown") return acc;
    acc[key] = (acc[key] ?? 0) + Number(row.lodged_count) || 0;
    return acc;
  }, {});

  return Object.entries(byMonth)
    .map(([key, lodged]) => ({
      monthKey: key,
      period: monthLabelFromKey(key),
      lodged,
    }))
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
}

function YearFilter({
  years,
  selectedYear,
  onChange,
}: {
  years: number[];
  selectedYear: number | "all";
  onChange: (year: number | "all") => void;
}) {
  return (
    <div className="mb-3 flex flex-wrap gap-2">
      {years.map((year) => (
        <button
          key={year}
          type="button"
          onClick={() => onChange(year)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-bold transition",
            selectedYear === year
              ? "border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border-white/80 bg-white/50 text-slate-600 hover:border-emerald-200 hover:text-emerald-700",
          )}
        >
          {year}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onChange("all")}
        className={cn(
          "rounded-full border px-3 py-1 text-xs font-bold transition",
          selectedYear === "all"
            ? "border-emerald-300 bg-emerald-50 text-emerald-800"
            : "border-white/80 bg-white/50 text-slate-600 hover:border-emerald-200 hover:text-emerald-700",
        )}
      >
        All years
      </button>
    </div>
  );
}

function LodgementTrendChartInner({
  data,
  loading,
}: {
  data: VisaLodgementRow[];
  loading?: boolean;
}) {
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    for (const row of data) {
      const key = monthKey(row.period);
      if (key !== "unknown") years.add(Number(key.slice(0, 4)));
    }
    return [...years].sort((a, b) => a - b);
  }, [data]);

  const currentYear = new Date().getFullYear();
  const defaultYear = availableYears.includes(currentYear) ? currentYear : "all";
  const [selectedYear, setSelectedYear] = useState<number | "all">(defaultYear);

  useEffect(() => {
    setSelectedYear(availableYears.includes(currentYear) ? currentYear : "all");
  }, [availableYears, currentYear]);

  const filteredRows = useMemo(() => {
    if (selectedYear === "all") return data;
    return data.filter((row) => monthKey(row.period).startsWith(String(selectedYear)));
  }, [data, selectedYear]);

  const chartData = useMemo(() => aggregateLodgedByMonth(filteredRows), [filteredRows]);
  const denseAxis = chartData.length > 12;
  const xAxisHeight = denseAxis ? 56 : 36;
  const chartBottomMargin = denseAxis ? 52 : 24;

  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;
  if (chartData.length === 0) {
    return (
      <>
        <YearFilter
          years={availableYears}
          selectedYear={selectedYear}
          onChange={setSelectedYear}
        />
        <EmptyState message={`No lodgements recorded for ${selectedYear}`} />
      </>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <YearFilter
        years={availableYears}
        selectedYear={selectedYear}
        onChange={setSelectedYear}
      />
      <div className="min-h-0 flex-1">
        <ChartFrame>
          <AreaChart
            data={chartData}
            margin={{ ...CHART_MARGIN, left: 0, bottom: chartBottomMargin }}
          >
            <AreaGradient id="visaLodged" color={CHART_COLORS.primary} />
            <ChartGrid />
            <ChartXAxis
              dataKey="period"
              interval={0}
              minTickGap={0}
              angle={denseAxis ? -40 : 0}
              textAnchor={denseAxis ? "end" : "middle"}
              height={xAxisHeight}
              tick={{ ...AXIS_TICK, fontSize: denseAxis ? 11 : 12 }}
            />
            <ChartYAxis allowDecimals={false} width={36} />
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
      </div>
    </div>
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
    if (key === "unknown") return acc;
    acc[key] = (acc[key] ?? 0) + (Number(row.pending_actions_count) || 0);
    return acc;
  }, {});

  const chartData = Object.entries(byMonth)
    .map(([key, pending]) => ({
      monthKey: key,
      period: monthLabelFromKey(key),
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
