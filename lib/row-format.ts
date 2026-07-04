import type { ReportColumn } from "./report-columns";

function toDateInputValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return "";
  return date.toISOString().slice(0, 10);
}

export function rowToEditor(
  row: Record<string, unknown>,
  columns: ReportColumn[],
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const col of columns) {
    const value = row[col.key];
    if (col.type === "date") {
      result[col.key] = toDateInputValue(value);
    } else if (value === null || value === undefined) {
      result[col.key] = "";
    } else {
      result[col.key] = String(value);
    }
  }
  return result;
}

export function editorToRow(
  row: Record<string, string>,
  columns: ReportColumn[],
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const col of columns) {
    const raw = row[col.key]?.trim() ?? "";
    if (col.type === "number") {
      result[col.key] = raw === "" ? 0 : Number(raw);
    } else if (col.type === "date") {
      result[col.key] = raw === "" ? null : raw;
    } else {
      result[col.key] = raw;
    }
  }
  return result;
}

export function rowsToEditor(
  rows: Record<string, unknown>[],
  columns: ReportColumn[],
): Record<string, string>[] {
  return rows.map((row) => rowToEditor(row, columns));
}

export function editorToRows(
  rows: Record<string, string>[],
  columns: ReportColumn[],
): Record<string, unknown>[] {
  return rows
    .map((row) => editorToRow(row, columns))
    .filter((row) => Object.values(row).some((value) => value !== "" && value !== 0 && value !== null));
}
