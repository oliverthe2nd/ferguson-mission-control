/** Monday 00:00 Australia/Brisbane as UTC Date for dashboard period_start. */
const BRISBANE_OFFSET_MS = 10 * 60 * 60 * 1000;

export function weekStartFromDate(date: Date): Date {
  const local = new Date(date.getTime() + BRISBANE_OFFSET_MS);
  const day = local.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  local.setUTCDate(local.getUTCDate() - daysSinceMonday);
  local.setUTCHours(0, 0, 0, 0);
  return new Date(local.getTime() - BRISBANE_OFFSET_MS);
}

export function weekKey(date: Date): string {
  return weekStartFromDate(date).toISOString().slice(0, 10);
}

export function parseZohoDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function daysBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24);
}

export function recentWeekStarts(weekCount: number, now = new Date()): Date[] {
  const current = weekStartFromDate(now);
  const weeks: Date[] = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    const week = new Date(current);
    week.setUTCDate(week.getUTCDate() - i * 7);
    weeks.push(week);
  }
  return weeks;
}

export function zohoBetweenRange(weekCount: number, now = new Date()): {
  start: Date;
  end: Date;
  weeks: Date[];
} {
  const weeks = recentWeekStarts(weekCount, now);
  const start = weeks[0]!;
  const end = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, weeks };
}

export function formatZohoDateTime(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  const local = new Date(date.getTime() + BRISBANE_OFFSET_MS);
  return (
    `${local.getUTCFullYear()}-${pad(local.getUTCMonth() + 1)}-${pad(local.getUTCDate())}` +
    `T${pad(local.getUTCHours())}:${pad(local.getUTCMinutes())}:${pad(local.getUTCSeconds())}+10:00`
  );
}