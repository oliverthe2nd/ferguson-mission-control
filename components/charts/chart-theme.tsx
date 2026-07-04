"use client";

import type { ReactElement } from "react";
import {
  CartesianGrid,
  Legend,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BarShapeProps } from "recharts";
import { CHART_COLORS } from "@/lib/constants";

export const CHART_HEIGHT = 270;

export const CHART_MARGIN = { top: 12, right: 18, left: -8, bottom: 4 };

export const SERIES_COLORS = [
  CHART_COLORS.primary,
  CHART_COLORS.secondary,
  CHART_COLORS.alert,
  CHART_COLORS.dark,
  CHART_COLORS.amber,
  CHART_COLORS.muted,
] as const;

export const GRID_STROKE = CHART_COLORS.grid;
export const GRID_DASH = "4 8";

export const AXIS_TICK = {
  fill: CHART_COLORS.muted,
  fontSize: 12,
  fontWeight: 600,
};

export const BAR_RADIUS: [number, number, number, number] = [12, 12, 0, 0];
export const BAR_RADIUS_H: [number, number, number, number] = [0, 12, 12, 0];
export const BAR_RADIUS_STACK_BOTTOM: [number, number, number, number] = [0, 0, 10, 10];
export const BAR_RADIUS_STACK_TOP: [number, number, number, number] = [10, 10, 0, 0];

export function stackBarRadius(
  seriesKey: string,
  payload: Record<string, unknown>,
  seriesKeys: readonly string[],
): [number, number, number, number] {
  const active = seriesKeys.filter((key) => Number(payload[key] ?? 0) > 0);
  if (active.length === 0) return [0, 0, 0, 0];

  const bottom = active[0]!;
  const top = active[active.length - 1]!;

  if (bottom === top) return BAR_RADIUS;
  if (seriesKey === bottom) return BAR_RADIUS_STACK_BOTTOM;
  if (seriesKey === top) return BAR_RADIUS_STACK_TOP;
  return [0, 0, 0, 0];
}

export function createStackBarShape(
  seriesKey: string,
  seriesKeys: readonly string[],
) {
  return function StackBarShape(props: BarShapeProps) {
    const { x = 0, y = 0, width = 0, height = 0, fill, payload } = props;
    if (!payload || height <= 0) return null;

    const radius = stackBarRadius(seriesKey, payload, seriesKeys);
    return (
      <Rectangle
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        radius={radius}
      />
    );
  };
}

export const LINE_PROPS = {
  type: "monotone" as const,
  strokeWidth: 4,
  dot: {
    r: 5,
    strokeWidth: 3,
    stroke: "#fff",
    fill: CHART_COLORS.primary,
  },
  activeDot: { r: 8, stroke: "#fff", strokeWidth: 4 },
};

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: ReadonlyArray<{
    value?: number | string;
    name?: string | number;
    color?: string;
    payload?: { fill?: string };
  }>;
  label?: string | number;
  valueFormatter?: (value: number, name: string) => string;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  valueFormatter,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 text-sm shadow-[0_18px_45px_rgba(31,42,61,0.14)] backdrop-blur">
      {label && (
        <div className="mb-2 font-semibold text-slate-800">{label}</div>
      )}
      <div className="space-y-1.5">
        {payload.map((entry, index) => {
          const raw = entry.value;
          const value =
            typeof raw === "number"
              ? valueFormatter
                ? valueFormatter(raw, String(entry.name ?? ""))
                : raw.toLocaleString()
              : String(raw ?? "");
          return (
            <div
              key={index}
              className="flex min-w-36 items-center justify-between gap-5"
            >
              <span className="flex items-center gap-2 text-slate-500">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{
                    backgroundColor: entry.color || entry.payload?.fill,
                  }}
                />
                {entry.name}
              </span>
              <span className="font-bold tabular-nums text-slate-900">
                {value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ChartGrid({ vertical = false }: { vertical?: boolean }) {
  return (
    <CartesianGrid
      stroke={GRID_STROKE}
      strokeDasharray={GRID_DASH}
      vertical={vertical}
    />
  );
}

export function ChartXAxis(props: React.ComponentProps<typeof XAxis>) {
  return (
    <XAxis axisLine={false} tickLine={false} tick={AXIS_TICK} dy={10} {...props} />
  );
}

export function ChartYAxis(props: React.ComponentProps<typeof YAxis>) {
  return (
    <YAxis axisLine={false} tickLine={false} tick={AXIS_TICK} dx={-4} {...props} />
  );
}

export function ChartLegend() {
  return (
    <Legend
      iconType="circle"
      iconSize={8}
      wrapperStyle={{ paddingTop: 18, fontWeight: 700, fontSize: 12 }}
    />
  );
}

export function ChartTooltip({
  valueFormatter,
}: {
  valueFormatter?: (value: number, name: string) => string;
}) {
  return (
    <Tooltip
      cursor={{ fill: "rgba(32, 201, 151, 0.06)" }}
      content={<ChartTooltipContent valueFormatter={valueFormatter} />}
    />
  );
}

export function ChartFrame({ children }: { children: ReactElement }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      {children}
    </ResponsiveContainer>
  );
}

export { ResponsiveContainer };

export function AreaGradient({ id, color }: { id: string; color: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor={color} stopOpacity={0.35} />
        <stop offset="100%" stopColor={color} stopOpacity={0.02} />
      </linearGradient>
    </defs>
  );
}

export function sortByDate<T>(
  rows: T[],
  getDate: (row: T) => Date | string,
): T[] {
  return [...rows].sort(
    (a, b) => new Date(getDate(a)).getTime() - new Date(getDate(b)).getTime(),
  );
}
