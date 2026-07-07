import type { AccountsReceivableRow } from "@/lib/validators/accounts-receivable";

const BUCKETS = [
  { key: "0-30", index: 2, daysOutstanding: 15 },
  { key: "31-60", index: 3, daysOutstanding: 45 },
  { key: "61-90", index: 4, daysOutstanding: 75 },
  { key: "90plus", index: 5, daysOutstanding: 105 },
] as const;

function slug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}

const MONTHS: Record<string, number> = {
  Jan: 0,
  Feb: 1,
  Mar: 2,
  Apr: 3,
  May: 4,
  Jun: 5,
  Jul: 6,
  Aug: 7,
  Sep: 8,
  Oct: 9,
  Nov: 10,
  Dec: 11,
};

function parseReportDate(rows: unknown[][]): Date {
  for (const row of rows.slice(0, 8)) {
    const cell = String(row[0] ?? "").trim();
    const match = cell.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
    if (match) {
      const month = MONTHS[match[2]];
      if (month == null) continue;
      return new Date(Date.UTC(Number(match[3]), month, Number(match[1])));
    }
  }
  return new Date();
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value;
  const n = Number(String(value ?? "").replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function subtractDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  return next;
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function isMyobUnpaidInvoicesSheet(rows: unknown[][]): boolean {
  const title = String(rows[0]?.[0] ?? "").toLowerCase();
  if (title.includes("unpaid invoices report")) return true;

  return rows.some((row) => {
    const first = String(row[0] ?? "").trim();
    const second = String(row[2] ?? "").trim();
    return first === "Customer name" && second === "0 - 30";
  });
}

function findHeaderIndex(rows: unknown[][]): number {
  return rows.findIndex((row) => String(row[0] ?? "").trim() === "Customer name");
}

/**
 * MYOB "Unpaid invoices report" — ageing summary by customer.
 * Expands each non-zero bucket into a dashboard row for charts and follow-up tiers.
 */
export function parseMyobUnpaidInvoicesRows(rows: unknown[][]): AccountsReceivableRow[] {
  if (!isMyobUnpaidInvoicesSheet(rows)) {
    throw new Error("Not a MYOB unpaid invoices report");
  }

  const reportDate = parseReportDate(rows);
  const headerIndex = findHeaderIndex(rows);
  if (headerIndex < 0) {
    throw new Error("MYOB report header row not found");
  }

  const reportKey = reportDate.toISOString().slice(0, 10).replace(/-/g, "");
  const output: AccountsReceivableRow[] = [];

  for (let i = headerIndex + 1; i < rows.length; i += 1) {
    const row = rows[i];
    const schoolName = String(row[0] ?? "").trim();
    if (!schoolName || schoolName === "Grand total") continue;

    const customerNumber = String(row[1] ?? "").trim() || "none";

    for (const bucket of BUCKETS) {
      const amount = toNumber(row[bucket.index]);
      if (amount <= 0) continue;

      const invoiceDate = subtractDays(reportDate, bucket.daysOutstanding);
      const dueDate = addDays(invoiceDate, 30);

      output.push({
        school_name: schoolName,
        invoice_ref: `MYOB-${reportKey}-${slug(schoolName)}-${bucket.key}-${slug(customerNumber)}`,
        invoice_date: invoiceDate,
        due_date: dueDate,
        amount_aud: Math.round(amount * 100) / 100,
        days_outstanding: bucket.daysOutstanding,
        last_contact_date: null,
        last_contact_note: `MYOB ageing bucket ${bucket.key.replace("plus", "+")}`,
      });
    }
  }

  if (output.length === 0) {
    throw new Error("No receivable rows found in MYOB report");
  }

  return output;
}
