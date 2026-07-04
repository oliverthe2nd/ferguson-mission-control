export function formatAud(value: number): string {
  return new Intl.NumberFormat("en-AU", {
    style: "currency",
    currency: "AUD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function formatDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Returns null for missing/invalid dates, including legacy Unix epoch placeholders. */
export function formatOptionalDate(
  value: Date | string | null | undefined,
): string | null {
  if (value === "" || value === null || value === undefined) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return null;

  return formatDate(date);
}

export function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString("en-AU", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatLastUpload(
  upload: { created_at: Date; file_name: string } | null | undefined,
): string | null {
  if (!upload) return null;
  return `${formatDateTime(upload.created_at)} · ${upload.file_name}`;
}

export function formatShortDate(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-AU", { day: "numeric", month: "short" });
}

export function formatMonthYear(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("en-AU", { month: "short", year: "numeric" });
}

/** Stable YYYY-MM bucket from report period dates (avoids timezone month shifts). */
export function monthKey(value: Date | string): string {
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}`;
  }

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "unknown";

  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function monthLabelFromKey(key: string): string {
  const match = key.match(/^(\d{4})-(\d{2})$/);
  if (!match) return key;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return date.toLocaleDateString("en-AU", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function monthOnlyLabelFromKey(key: string): string {
  const match = key.match(/^(\d{4})-(\d{2})$/);
  if (!match) return key;

  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1));
  return date.toLocaleDateString("en-AU", { month: "short", timeZone: "UTC" });
}
