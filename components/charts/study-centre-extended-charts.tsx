"use client";

import { useState } from "react";
import { Bar, BarChart, Line, LineChart } from "recharts";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CHART_COLORS } from "@/lib/constants";
import type { StudyCentreAvgDays, StudyCentrePipelineStage } from "@/lib/framework/types";
import { sampleStudyCentreWalkInDrilldown } from "@/lib/framework/sample-supplements";
import { formatMonthYear, monthKey } from "@/lib/format";
import type { StudyCentresRow } from "@/lib/validators/study-centres";
import { ChartDrilldownPanel } from "./chart-drilldown-panel";
import {
  BAR_RADIUS,
  BAR_RADIUS_H,
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

function WalkInTrafficChartInner({ data, loading }: { data: StudyCentresRow[]; loading?: boolean }) {
  const [drilldown, setDrilldown] = useState<{ branch: string; period: string } | null>(null);

  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const byPeriod = new Map<string, { period: string; Lautoka: number; "Port Moresby": number; Lae: number }>();

  for (const row of sortByDate(data, (r) => r.period)) {
    const period = formatMonthYear(row.period);
    if (!byPeriod.has(period)) {
      byPeriod.set(period, { period, Lautoka: 0, "Port Moresby": 0, Lae: 0 });
    }
    const entry = byPeriod.get(period)!;
    if (row.branch === "Lautoka") entry.Lautoka = row.walkin_traffic;
    if (row.branch === "Port Moresby") entry["Port Moresby"] = row.walkin_traffic;
    if (row.branch === "Lae") entry.Lae = row.walkin_traffic;
  }

  const aggregated = [...byPeriod.values()];

  return (
    <>
      <ChartFrame>
        <BarChart data={aggregated} margin={CHART_MARGIN}>
          <ChartGrid />
          <ChartXAxis dataKey="period" />
          <ChartYAxis allowDecimals={false} />
          <ChartTooltip />
          <ChartLegend />
          {Object.entries(BRANCH_COLORS).map(([branch, color]) => (
            <Bar
              key={branch}
              dataKey={branch}
              fill={color}
              radius={BAR_RADIUS}
              className="cursor-pointer"
              onClick={() => setDrilldown({ branch, period: aggregated[0]?.period ?? "" })}
            />
          ))}
        </BarChart>
      </ChartFrame>
      {drilldown && (
        <ChartDrilldownPanel
          title="Walk-in traffic"
          subtitle={`${drilldown.branch} · ${drilldown.period}`}
          records={sampleStudyCentreWalkInDrilldown(drilldown.branch, drilldown.period)}
          onClose={() => setDrilldown(null)}
        />
      )}
    </>
  );
}

function ScheduledLeadsChartInner({ data, loading }: { data: StudyCentresRow[]; loading?: boolean }) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const chartData = sortByDate(data, (row) => row.period).map((row) => ({
    key: `${monthKey(row.period)}-${row.branch}`,
    label: `${row.branch} · ${formatMonthYear(row.period)}`,
    period: formatMonthYear(row.period),
    branch: row.branch,
    leads: row.scheduled_leads,
  }));

  return (
    <ChartFrame>
      <BarChart data={chartData} margin={{ ...CHART_MARGIN, left: 8 }} layout="vertical">
        <ChartGrid vertical />
        <ChartXAxis type="number" allowDecimals={false} />
        <ChartYAxis type="category" dataKey="label" width={160} tick={{ fontSize: 11 }} />
        <ChartTooltip />
        <Bar dataKey="leads" name="Scheduled leads" fill={CHART_COLORS.secondary} radius={BAR_RADIUS_H} />
      </BarChart>
    </ChartFrame>
  );
}

function StudyCentrePipelineChartInner({ stages }: { stages: StudyCentrePipelineStage[] }) {
  return (
    <ChartFrame>
      <BarChart data={stages} layout="vertical" margin={{ ...CHART_MARGIN, left: 8 }}>
        <ChartGrid vertical />
        <ChartXAxis type="number" allowDecimals={false} />
        <ChartYAxis type="category" dataKey="stage" width={200} tick={{ fontSize: 11 }} />
        <ChartTooltip />
        <Bar dataKey="count" name="Students" fill={CHART_COLORS.primary} radius={BAR_RADIUS_H} />
      </BarChart>
    </ChartFrame>
  );
}

function StudyCentreAvgDaysChartInner({ data }: { data: StudyCentreAvgDays[] }) {
  const chartData = sortByDate(data, (row) => row.period).map((row) => ({
    period: formatMonthYear(row.period),
    regToOffer: row.avg_days_reg_to_offer,
    offerToPayment: row.avg_days_offer_to_first_payment,
  }));

  return (
    <ChartFrame>
      <LineChart data={chartData} margin={CHART_MARGIN}>
        <ChartGrid />
        <ChartXAxis dataKey="period" />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip valueFormatter={(v) => `${v} days`} />
        <ChartLegend />
        <Line
          {...LINE_PROPS}
          dataKey="regToOffer"
          name="Reg → Offer"
          stroke={CHART_COLORS.primary}
          dot={{ ...LINE_PROPS.dot, fill: CHART_COLORS.primary }}
        />
        <Line
          {...LINE_PROPS}
          dataKey="offerToPayment"
          name="Offer → 1st installment"
          stroke={CHART_COLORS.alert}
          dot={{ ...LINE_PROPS.dot, fill: CHART_COLORS.alert }}
        />
      </LineChart>
    </ChartFrame>
  );
}

export function WalkInTrafficChart(props: { data: StudyCentresRow[]; loading?: boolean }) {
  return (
    <ChartErrorBoundary>
      <WalkInTrafficChartInner {...props} />
    </ChartErrorBoundary>
  );
}

export function ScheduledLeadsChart(props: { data: StudyCentresRow[]; loading?: boolean }) {
  return (
    <ChartErrorBoundary>
      <ScheduledLeadsChartInner {...props} />
    </ChartErrorBoundary>
  );
}

export function StudyCentrePipelineChart(props: { stages: StudyCentrePipelineStage[] }) {
  return (
    <ChartErrorBoundary>
      <StudyCentrePipelineChartInner {...props} />
    </ChartErrorBoundary>
  );
}

export function StudyCentreAvgDaysChart(props: { data: StudyCentreAvgDays[] }) {
  return (
    <ChartErrorBoundary>
      <StudyCentreAvgDaysChartInner {...props} />
    </ChartErrorBoundary>
  );
}
