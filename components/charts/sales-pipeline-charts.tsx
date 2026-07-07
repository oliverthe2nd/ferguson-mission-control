"use client";

import { useState } from "react";
import { Bar, BarChart, ComposedChart, Line } from "recharts";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { CHART_COLORS } from "@/lib/constants";
import { sampleSalesLeadDrilldown } from "@/lib/framework/sample-supplements";
import { formatPct, formatShortDate } from "@/lib/format";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";
import { ChartDrilldownPanel } from "./chart-drilldown-panel";
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

const LEAD_SERIES = [
  { key: "Facebook", field: "leads_facebook" as const, color: SERIES_COLORS[0] },
  { key: "Website", field: "leads_website" as const, color: SERIES_COLORS[1] },
  { key: "Walk-in", field: "leads_walkin" as const, color: SERIES_COLORS[2] },
  { key: "Seminar", field: "leads_seminar" as const, color: CHART_COLORS.amber },
  { key: "Other", field: "leads_other" as const, color: SERIES_COLORS[3] },
] as const;

function LeadSourceBarChartInner({
  data,
  loading,
}: {
  data: SalesPipelineRow[];
  loading?: boolean;
}) {
  const [drilldown, setDrilldown] = useState<{
    title: string;
    subtitle: string;
    source: string;
  } | null>(null);

  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const chartData = sortByDate(data, (row) => row.period_start).map((row) => ({
    period: formatShortDate(row.period_start),
    Facebook: row.leads_facebook,
    Website: row.leads_website,
    "Walk-in": row.leads_walkin,
    Seminar: row.leads_seminar ?? 0,
    Other: row.leads_other,
  }));

  const seriesKeys = LEAD_SERIES.map((s) => s.key);

  return (
    <>
      <ChartFrame>
        <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="20%">
          <ChartGrid />
          <ChartXAxis dataKey="period" />
          <ChartYAxis allowDecimals={false} />
          <ChartTooltip />
          <ChartLegend />
          {LEAD_SERIES.map(({ key, color }) => (
            <Bar
              key={key}
              dataKey={key}
              stackId="leads"
              fill={color}
              shape={createStackBarShape(key, seriesKeys)}
              className="cursor-pointer"
              onClick={(barData) => {
                const payload = barData as { period?: string };
                setDrilldown({
                  title: `${key} leads`,
                  subtitle: payload.period ?? "",
                  source: key,
                });
              }}
            />
          ))}
        </BarChart>
      </ChartFrame>
      {drilldown && (
        <ChartDrilldownPanel
          title={drilldown.title}
          subtitle={drilldown.subtitle}
          records={sampleSalesLeadDrilldown(drilldown.subtitle, drilldown.source)}
          onClose={() => setDrilldown(null)}
        />
      )}
    </>
  );
}

function TotalLeadsChartInner({ data, loading }: { data: SalesPipelineRow[]; loading?: boolean }) {
  const [drilldown, setDrilldown] = useState<string | null>(null);

  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const chartData = sortByDate(data, (row) => row.period_start).map((row) => {
    const total =
      row.leads_facebook +
      row.leads_website +
      row.leads_walkin +
      (row.leads_seminar ?? 0) +
      row.leads_other;
    return { period: formatShortDate(row.period_start), total };
  });

  return (
    <>
      <ChartFrame>
        <BarChart data={chartData} margin={CHART_MARGIN}>
          <ChartGrid />
          <ChartXAxis dataKey="period" />
          <ChartYAxis allowDecimals={false} />
          <ChartTooltip />
          <Bar
            dataKey="total"
            name="Total leads"
            fill={CHART_COLORS.primary}
            radius={[6, 6, 0, 0]}
            className="cursor-pointer"
            onClick={(barData) => {
              const payload = barData as { period?: string };
              if (payload.period) setDrilldown(payload.period);
            }}
          />
        </BarChart>
      </ChartFrame>
      {drilldown && (
        <ChartDrilldownPanel
          title="Leads received"
          subtitle={drilldown}
          records={sampleSalesLeadDrilldown(drilldown, "All sources")}
          onClose={() => setDrilldown(null)}
        />
      )}
    </>
  );
}

function RegistrationsTrendChartInner({
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
    registrations: row.total_registrations,
    conversionPct: row.lead_to_reg_pct,
  }));

  return (
    <ChartFrame>
      <ComposedChart data={chartData} margin={CHART_MARGIN}>
        <ChartGrid />
        <ChartXAxis dataKey="period" />
        <ChartYAxis yAxisId="left" allowDecimals={false} />
        <ChartYAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
        <ChartTooltip />
        <ChartLegend />
        <Bar
          yAxisId="left"
          dataKey="registrations"
          name="Registrations"
          fill={CHART_COLORS.primary}
          radius={[6, 6, 0, 0]}
        />
        <Line
          yAxisId="right"
          {...LINE_PROPS}
          dataKey="conversionPct"
          name="Conversion %"
          stroke={CHART_COLORS.alert}
          dot={{ ...LINE_PROPS.dot, fill: CHART_COLORS.alert }}
        />
      </ComposedChart>
    </ChartFrame>
  );
}

function LeadConversionChartInner({
  data,
  loading,
}: {
  data: SalesPipelineRow[];
  loading?: boolean;
}) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const chartData = sortByDate(data, (row) => row.period_start).map((row) => {
    const totalLeads =
      row.leads_facebook +
      row.leads_website +
      row.leads_walkin +
      (row.leads_seminar ?? 0) +
      row.leads_other;
    return {
      period: formatShortDate(row.period_start),
      leads: totalLeads,
      registrations: row.total_registrations,
      conversionPct: row.lead_to_reg_pct,
    };
  });

  return (
    <ChartFrame>
      <ComposedChart data={chartData} margin={CHART_MARGIN}>
        <ChartGrid />
        <ChartXAxis dataKey="period" />
        <ChartYAxis yAxisId="left" allowDecimals={false} />
        <ChartYAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
        <ChartTooltip valueFormatter={(v, name) => (name === "Conversion %" ? formatPct(Number(v)) : String(v))} />
        <ChartLegend />
        <Bar yAxisId="left" dataKey="leads" name="Leads" fill={CHART_COLORS.muted} radius={[6, 6, 0, 0]} />
        <Bar yAxisId="left" dataKey="registrations" name="Registrations" fill={CHART_COLORS.primary} radius={[6, 6, 0, 0]} />
        <Line
          yAxisId="right"
          {...LINE_PROPS}
          dataKey="conversionPct"
          name="Conversion %"
          stroke={CHART_COLORS.alert}
          dot={{ ...LINE_PROPS.dot, fill: CHART_COLORS.alert }}
        />
      </ComposedChart>
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
      <ComposedChart data={chartData} margin={CHART_MARGIN}>
        <ChartGrid />
        <ChartXAxis dataKey="period" />
        <ChartYAxis tickFormatter={(v) => `${v}%`} domain={[0, "auto"]} />
        <ChartTooltip valueFormatter={(v) => formatPct(Number(v))} />
        <Line
          {...LINE_PROPS}
          dataKey="conversion"
          name="Conversion %"
          stroke={CHART_COLORS.primary}
          dot={{ ...LINE_PROPS.dot, fill: CHART_COLORS.primary }}
        />
      </ComposedChart>
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

export function TotalLeadsChart(props: { data: SalesPipelineRow[]; loading?: boolean }) {
  return (
    <ChartErrorBoundary>
      <TotalLeadsChartInner {...props} />
    </ChartErrorBoundary>
  );
}

export function RegistrationsTrendChart(props: { data: SalesPipelineRow[]; loading?: boolean }) {
  return (
    <ChartErrorBoundary>
      <RegistrationsTrendChartInner {...props} />
    </ChartErrorBoundary>
  );
}

export function LeadConversionChart(props: { data: SalesPipelineRow[]; loading?: boolean }) {
  return (
    <ChartErrorBoundary>
      <LeadConversionChartInner {...props} />
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
