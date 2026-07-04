"use client";

import { Bar, BarChart, Line, LineChart } from "recharts";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CHART_COLORS } from "@/lib/constants";
import { formatPct, formatShortDate } from "@/lib/format";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";
import {
  CHART_MARGIN,
  ChartFrame,
  ChartGrid,
  ChartLegend,
  ChartTooltip,
  ChartXAxis,
  ChartYAxis,
  createStackBarShape,
  LINE_PROPS,
  SERIES_COLORS,
  sortByDate,
} from "./chart-theme";

function LeadSourceBarChartInner({
  data,
  loading,
}: {
  data: SalesPipelineRow[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const chartData = sortByDate(data, (row) => row.period_start).map((row) => ({
    period: formatShortDate(row.period_start),
    Facebook: row.leads_facebook,
    Website: row.leads_website,
    "Walk-in": row.leads_walkin,
    Other: row.leads_other,
  }));

  const series = [
    { key: "Facebook", color: SERIES_COLORS[0] },
    { key: "Website", color: SERIES_COLORS[1] },
    { key: "Walk-in", color: SERIES_COLORS[2] },
    { key: "Other", color: SERIES_COLORS[3] },
  ] as const;
  const seriesKeys = series.map(({ key }) => key);

  return (
    <ChartFrame>
      <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="20%">
        <ChartGrid />
        <ChartXAxis dataKey="period" />
        <ChartYAxis allowDecimals={false} />
        <ChartTooltip />
        <ChartLegend />
        {series.map(({ key, color }) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="leads"
            fill={color}
            shape={createStackBarShape(key, seriesKeys)}
          />
        ))}
      </BarChart>
    </ChartFrame>
  );
}

function ConversionTrendChartInner({
  data,
  loading,
}: {
  data: SalesPipelineRow[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const chartData = sortByDate(data, (row) => row.period_start).map((row) => ({
    period: formatShortDate(row.period_start),
    conversion: row.lead_to_reg_pct,
  }));

  return (
    <ChartFrame>
      <LineChart data={chartData} margin={CHART_MARGIN}>
        <ChartGrid />
        <ChartXAxis dataKey="period" />
        <ChartYAxis tickFormatter={(v) => `${v}%`} domain={[0, "auto"]} />
        <ChartTooltip
          valueFormatter={(v) => formatPct(v)}
        />
        <Line
          {...LINE_PROPS}
          dataKey="conversion"
          name="Conversion"
          stroke={CHART_COLORS.primary}
          dot={{ ...LINE_PROPS.dot, fill: CHART_COLORS.primary }}
        />
      </LineChart>
    </ChartFrame>
  );
}

function AvgDaysTrendChartInner({
  data,
  loading,
}: {
  data: SalesPipelineRow[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const chartData = sortByDate(data, (row) => row.period_start).map((row) => ({
    period: formatShortDate(row.period_start),
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
          name="Offer → Payment"
          stroke={CHART_COLORS.alert}
          dot={{ ...LINE_PROPS.dot, fill: CHART_COLORS.alert }}
        />
      </LineChart>
    </ChartFrame>
  );
}

export function LeadSourceBarChart(props: { data: SalesPipelineRow[]; loading?: boolean }) {
  return (
    <ChartErrorBoundary>
      <LeadSourceBarChartInner {...props} />
    </ChartErrorBoundary>
  );
}

export function ConversionTrendChart(props: { data: SalesPipelineRow[]; loading?: boolean }) {
  return (
    <ChartErrorBoundary>
      <ConversionTrendChartInner {...props} />
    </ChartErrorBoundary>
  );
}

export function AvgDaysTrendChart(props: { data: SalesPipelineRow[]; loading?: boolean }) {
  return (
    <ChartErrorBoundary>
      <AvgDaysTrendChartInner {...props} />
    </ChartErrorBoundary>
  );
}
