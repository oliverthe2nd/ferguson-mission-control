"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";
import { CHART_COLORS } from "@/lib/constants";

interface SummarySparklineProps {
  data: { value: number }[];
  loading?: boolean;
}

export function SummarySparkline({ data, loading }: SummarySparklineProps) {
  if (loading) {
    return <div className="h-12 animate-pulse rounded-lg bg-slate-100" />;
  }

  if (data.length === 0) {
    return <div className="h-12 rounded-lg bg-slate-50" />;
  }

  return (
    <div className="h-12 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 6, right: 0, left: 0, bottom: 0 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={CHART_COLORS.primary}
            strokeWidth={2}
            dot={false}
            activeDot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
