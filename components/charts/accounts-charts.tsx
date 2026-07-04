"use client";

import { Area, AreaChart, Bar, BarChart, Cell } from "recharts";
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
  ChartXAxis,
  ChartYAxis,
} from "./chart-theme";

const BUCKET_COLORS: Record<string, string> = {
  Current: CHART_COLORS.primary,
  "Follow Up": "#F59E0B",
  Urgent: CHART_COLORS.alert,
  "Legal Demand": CHART_COLORS.dark,
};

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
    .map(([school, amount]) => ({ school, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return (
    <ChartFrame>
      <BarChart data={chartData} layout="vertical" margin={{ ...CHART_MARGIN, left: 8 }}>
        <ChartGrid vertical />
        <ChartXAxis type="number" tickFormatter={(v) => formatAud(v)} />
        <ChartYAxis type="category" dataKey="school" width={132} tick={{ fontSize: 11 }} />
        <ChartTooltip valueFormatter={(v) => formatAud(v)} />
        <Bar dataKey="amount" name="Outstanding" fill={CHART_COLORS.dark} radius={BAR_RADIUS_H} />
      </BarChart>
    </ChartFrame>
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
