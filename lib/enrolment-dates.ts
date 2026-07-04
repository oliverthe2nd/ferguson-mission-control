import type { EnrolmentMilestoneRow } from "./validators/enrolment-milestones";

const ENROLMENT_DATE_KEYS = [
  "registration_date",
  "m1_target",
  "m1_actual",
  "m2_target",
  "m2_actual",
  "m3_target",
  "m3_actual",
  "m4_target",
  "m4_actual",
  "m5_target",
  "m5_actual",
] as const satisfies ReadonlyArray<keyof EnrolmentMilestoneRow>;

/** Blank CSV cells were once parsed as Unix epoch — treat as missing. */
export function sanitizeOptionalDate(
  value: Date | string | null | undefined,
): Date | null {
  if (value === "" || value === null || value === undefined) return null;

  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime()) || date.getTime() === 0) return null;

  return date;
}

export function normalizeEnrolmentRow(row: EnrolmentMilestoneRow): EnrolmentMilestoneRow {
  const normalized = { ...row } as EnrolmentMilestoneRow;

  for (const key of ENROLMENT_DATE_KEYS) {
    normalized[key] = sanitizeOptionalDate(row[key] as Date | string | null);
  }

  return normalized;
}

export function normalizeEnrolmentRows(
  rows: EnrolmentMilestoneRow[],
): EnrolmentMilestoneRow[] {
  return rows.map(normalizeEnrolmentRow);
}

export function getMilestoneActual(
  row: EnrolmentMilestoneRow,
  key: "m1" | "m2" | "m3" | "m4" | "m5",
): Date | null {
  return sanitizeOptionalDate(row[`${key}_actual`]);
}

export function getMilestoneTarget(
  row: EnrolmentMilestoneRow,
  key: "m1" | "m2" | "m3" | "m4" | "m5",
): Date | null {
  return sanitizeOptionalDate(row[`${key}_target`]);
}
