"use client";

import { Area, AreaChart, Bar, BarChart, Cell, Tooltip } from "recharts";
import { ChartErrorBoundary } from "@/components/ui/chart-error-boundary";
import { ChartSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { getArStatus } from "@/lib/alerts";
import { CHART_COLORS } from "@/lib/constants";
import { formatAud } from "@/lib/format";
import type { AccountsReceivableRow } from "@/lib/validators/accounts-receivable";
import {
  AreaGradient,
  BAR_RADIUS,
  BAR_RADIUS_H,
  CHART_MARGIN,
  ChartFrame,
  ChartGrid,
  ChartTooltip,
  ChartTooltipContent,
  ChartXAxis,
  ChartYAxis,
} from "./chart-theme";

const BUCKET_COLORS: Record<string, string> = {
  Current: CHART_COLORS.primary,
  "Follow Up": "#F59E0B",
  Urgent: CHART_COLORS.alert,
  "Legal Demand": CHART_COLORS.dark,
};

/** Single-line school label for chart axes — full name stays in tooltip. */
function shortenSchoolName(name: string, maxLength = 22): string {
  const tradingAs = name.match(/\(T\/A\s+([^)]+)\)\s*$/i);
  const acronym = name.match(/\(([A-Z]{2,8})\)\s*$/);
  let short = name
    .replace(/\s*\(T\/A\s+[^)]+\)\s*$/i, "")
    .replace(/\s*\([^)]*(?:Pty|Ltd|Limited|Education|Management)[^)]*\)/gi, " ")
    .replace(/\s+Pty\s+Ltd\.?$/i, "")
    .replace(/\s+Pty\s+Limited$/i, "")
    .replace(/\s+Limited$/i, "")
    .replace(/\s{2,}/g, " ")
    .trim();

  if (tradingAs) {
    const label = tradingAs[1].trim();
    if (label.length <= maxLength) return label;
  }
  if (short.length > maxLength && acronym) {
    return acronym[1];
  }
  if (short.length > maxLength) {
    return `${short.slice(0, maxLength - 1)}…`;
  }
  return short;
}

function SchoolAxisTick(props: {
  x?: string | number;
  y?: string | number;
  payload?: { value?: string };
}) {
  const x = typeof props.x === "number" ? props.x : Number(props.x ?? 0);
  const y = typeof props.y === "number" ? props.y : Number(props.y ?? 0);

  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill={CHART_COLORS.muted}
      fontSize={11}
      fontWeight={600}
    >
      {props.payload?.value ?? ""}
    </text>
  );
}

function ArBucketChartInner({ data, loading }: { data: AccountsReceivableRow[]; loading?: boolean }) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const buckets = { Current: 0, "Follow Up": 0, Urgent: 0, "Legal Demand": 0 };
  for (const row of data) {
    const status = getArStatus(row.days_outstanding);
    buckets[status.label as keyof typeof buckets] += row.amount_aud;
  }

  const chartData = Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }));

  return (
    <ChartFrame>
      <BarChart data={chartData} margin={CHART_MARGIN} barCategoryGap="28%">
        <ChartGrid />
        <ChartXAxis dataKey="bucket" interval={0} />
        <ChartYAxis tickFormatter={(v) => formatAud(v)} width={72} />
        <ChartTooltip valueFormatter={(v) => formatAud(v)} />
        <Bar dataKey="amount" name="Amount" radius={BAR_RADIUS}>
          {chartData.map((entry) => (
            <Cell key={entry.bucket} fill={BUCKET_COLORS[entry.bucket]} />
          ))}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

function ReceivablesTrendChartInner({ data, loading }: { data: AccountsReceivableRow[]; loading?: boolean }) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const total = data.reduce((sum, row) => sum + row.amount_aud, 0);

  return (
    <ChartFrame>
      <AreaChart data={[{ label: "Total Outstanding", amount: total }]} margin={CHART_MARGIN}>
        <AreaGradient id="arGradient" color={CHART_COLORS.primary} />
        <ChartGrid />
        <ChartXAxis dataKey="label" />
        <ChartYAxis tickFormatter={(v) => formatAud(v)} width={72} />
        <ChartTooltip valueFormatter={(v) => formatAud(v)} />
        <Area
          type="monotone"
          dataKey="amount"
          name="Receivables"
          stroke={CHART_COLORS.primary}
          strokeWidth={2.5}
          fill="url(#arGradient)"
        />
      </AreaChart>
    </ChartFrame>
  );
}

function SchoolOutstandingChartInner({ data, loading }: { data: AccountsReceivableRow[]; loading?: boolean }) {
  if (loading) return <ChartSkeleton />;
  if (data.length === 0) return <EmptyState />;

  const bySchool = data.reduce<Record<string, number>>((acc, row) => {
    acc[row.school_name] = (acc[row.school_name] ?? 0) + row.amount_aud;
    return acc;
  }, {});

  const chartData = Object.entries(bySchool)
    .map(([school, amount]) => ({
      school,
      schoolShort: shortenSchoolName(school),
      amount,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  const chartHeight = Math.max(360, chartData.length * 40);

  return (
    <div style={{ height: chartHeight }}>
      <ChartFrame>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 8, right: 20, left: 8, bottom: 8 }}
          barCategoryGap="18%"
        >
          <ChartGrid vertical />
          <ChartXAxis type="number" tickFormatter={(v) => formatAud(v)} />
          <ChartYAxis
            type="category"
            dataKey="schoolShort"
            width={172}
            interval={0}
            tick={SchoolAxisTick}
          />
        <Tooltip
          cursor={{ fill: "rgba(32, 201, 151, 0.06)" }}
          content={({ active, payload }) => {
            if (!active || !payload?.[0]) return null;
            const row = payload[0].payload as { school: string };
            return (
              <ChartTooltipContent
                active
                label={row.school}
                payload={payload as Parameters<typeof ChartTooltipContent>[0]["payload"]}
                valueFormatter={(v) => formatAud(v)}
              />
            );
          }}
        />
        <Bar dataKey="amount" name="Outstanding" fill={CHART_COLORS.dark} radius={BAR_RADIUS_H} />
      </BarChart>
    </ChartFrame>
    </div>
  );
}

export function ArBucketChart(props: { data: AccountsReceivableRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><ArBucketChartInner {...props} /></ChartErrorBoundary>;
}

export function ReceivablesTrendChart(props: { data: AccountsReceivableRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><ReceivablesTrendChartInner {...props} /></ChartErrorBoundary>;
}

export function SchoolOutstandingChart(props: { data: AccountsReceivableRow[]; loading?: boolean }) {
  return <ChartErrorBoundary><SchoolOutstandingChartInner {...props} /></ChartErrorBoundary>;
}
