/**
 * Microsoft Graph sync for the Enrolments Team Tracker (SharePoint / OneDrive xlsx).
 *
 * Env:
 * - MS_GRAPH_TENANT_ID
 * - MS_GRAPH_CLIENT_ID
 * - MS_GRAPH_CLIENT_SECRET
 * - MS_GRAPH_DRIVE_ITEM_ID — preferred: drive item id of the xlsx
 *   OR MS_GRAPH_SHARE_URL — sharing link (encoded automatically)
 */

import * as XLSX from "xlsx";
import { publishReportData } from "@/lib/publish-report";
import type { EnrolmentMilestoneRow } from "@/lib/validators/enrolment-milestones";

export function isMicrosoftGraphConfigured(): boolean {
  const creds =
    process.env.MS_GRAPH_TENANT_ID &&
    process.env.MS_GRAPH_CLIENT_ID &&
    process.env.MS_GRAPH_CLIENT_SECRET;
  if (!creds) return false;
  if (process.env.MS_GRAPH_SHARE_URL) return true;
  return Boolean(
    process.env.MS_GRAPH_DRIVE_ITEM_ID &&
      (process.env.MS_GRAPH_SITE_ID || process.env.MS_GRAPH_DRIVE_ID),
  );
}

async function getGraphToken(): Promise<string> {
  const tenant = process.env.MS_GRAPH_TENANT_ID!;
  const clientId = process.env.MS_GRAPH_CLIENT_ID!;
  const clientSecret = process.env.MS_GRAPH_CLIENT_SECRET!;

  const response = await fetch(
    `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
    },
  );
  const body = (await response.json()) as {
    access_token?: string;
    error_description?: string;
    error?: string;
  };
  if (!response.ok || !body.access_token) {
    throw new Error(
      body.error_description ?? body.error ?? "Microsoft Graph token failed",
    );
  }
  return body.access_token;
}

function encodeSharingUrl(url: string): string {
  const base64 = Buffer.from(url, "utf8").toString("base64");
  return `u!${base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "")}`;
}

async function downloadEnrolmentWorkbook(
  token: string,
): Promise<ArrayBuffer> {
  let downloadUrl: string;

  if (process.env.MS_GRAPH_SHARE_URL) {
    const share = encodeSharingUrl(process.env.MS_GRAPH_SHARE_URL);
    downloadUrl = `https://graph.microsoft.com/v1.0/shares/${share}/driveItem/content`;
  } else if (
    process.env.MS_GRAPH_SITE_ID &&
    process.env.MS_GRAPH_DRIVE_ITEM_ID
  ) {
    downloadUrl = `https://graph.microsoft.com/v1.0/sites/${process.env.MS_GRAPH_SITE_ID}/drive/items/${process.env.MS_GRAPH_DRIVE_ITEM_ID}/content`;
  } else if (
    process.env.MS_GRAPH_DRIVE_ID &&
    process.env.MS_GRAPH_DRIVE_ITEM_ID
  ) {
    downloadUrl = `https://graph.microsoft.com/v1.0/drives/${process.env.MS_GRAPH_DRIVE_ID}/items/${process.env.MS_GRAPH_DRIVE_ITEM_ID}/content`;
  } else {
    throw new Error(
      "Set MS_GRAPH_SHARE_URL or MS_GRAPH_SITE_ID/MS_GRAPH_DRIVE_ID with MS_GRAPH_DRIVE_ITEM_ID",
    );
  }

  const response = await fetch(downloadUrl, {
    headers: { Authorization: `Bearer ${token}` },
    redirect: "follow",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to download enrolment workbook (${response.status}): ${text.slice(0, 200)}`,
    );
  }
  return response.arrayBuffer();
}

function headerKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

const ENROLMENT_ALIASES: Record<string, keyof EnrolmentMilestoneRow | "skip"> = {
  client_id: "student_id",
  student_id: "student_id",
  client_name: "student_name",
  student_name: "student_name",
  date_registered: "registration_date",
  registration_date: "registration_date",
  m1_first_consult_due: "m1_target",
  m1_first_consult_paid: "m1_actual",
  m1_target: "m1_target",
  m1_actual: "m1_actual",
  m2_tuition_school_deposit_due: "m2_target",
  m2_tuition_school_deposit_paid: "m2_actual",
  m2_target: "m2_target",
  m2_actual: "m2_actual",
  m3_visa_lodgement_fee_due: "m3_target",
  m3_visa_lodgement_fee_paid: "m3_actual",
  m3_target: "m3_target",
  m3_actual: "m3_actual",
  m4_oshc_due: "m4_target",
  m4_oshc_paid: "m4_actual",
  m4_target: "m4_target",
  m4_actual: "m4_actual",
  m5_second_consult_due: "m5_target",
  m5_second_consult_paid: "m5_actual",
  m5_target: "m5_target",
  m5_actual: "m5_actual",
};

function parseExcelDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return new Date(Date.UTC(parsed.y, parsed.m - 1, parsed.d));
  }
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function mapWorkbookToEnrolmentRows(
  buffer: ArrayBuffer,
): EnrolmentMilestoneRow[] {
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];
  const sheet = workbook.Sheets[sheetName]!;
  const matrix = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(
    sheet,
    { header: 1, defval: null, raw: true },
  ) as unknown as unknown[][];

  if (matrix.length < 2) return [];

  // Support optional 2-row group headers: find the row that contains Client ID / Student ID
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(5, matrix.length); i++) {
    const keys = (matrix[i] ?? []).map((c) => headerKey(String(c ?? "")));
    if (
      keys.some((k) => k === "client_id" || k === "student_id") &&
      keys.some((k) => k.includes("client_name") || k === "student_name")
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const headers = (matrix[headerRowIndex] ?? []).map((c) =>
    headerKey(String(c ?? "")),
  );
  const fieldIndex = new Map<keyof EnrolmentMilestoneRow, number>();
  headers.forEach((header, idx) => {
    const field = ENROLMENT_ALIASES[header];
    if (field && field !== "skip") fieldIndex.set(field, idx);
  });

  if (!fieldIndex.has("student_id")) {
    throw new Error(
      "Enrolment workbook missing Client ID / student_id column",
    );
  }

  const rows: EnrolmentMilestoneRow[] = [];
  for (const line of matrix.slice(headerRowIndex + 1)) {
    const idIdx = fieldIndex.get("student_id")!;
    const studentId = String(line[idIdx] ?? "").trim();
    if (!studentId) continue;

    const nameIdx = fieldIndex.get("student_name");
    rows.push({
      student_id: studentId,
      student_name:
        nameIdx != null ? String(line[nameIdx] ?? "").trim() || studentId : studentId,
      registration_date: parseExcelDate(
        fieldIndex.has("registration_date")
          ? line[fieldIndex.get("registration_date")!]
          : null,
      ),
      m1_target: parseExcelDate(
        fieldIndex.has("m1_target") ? line[fieldIndex.get("m1_target")!] : null,
      ),
      m1_actual: parseExcelDate(
        fieldIndex.has("m1_actual") ? line[fieldIndex.get("m1_actual")!] : null,
      ),
      m2_target: parseExcelDate(
        fieldIndex.has("m2_target") ? line[fieldIndex.get("m2_target")!] : null,
      ),
      m2_actual: parseExcelDate(
        fieldIndex.has("m2_actual") ? line[fieldIndex.get("m2_actual")!] : null,
      ),
      m3_target: parseExcelDate(
        fieldIndex.has("m3_target") ? line[fieldIndex.get("m3_target")!] : null,
      ),
      m3_actual: parseExcelDate(
        fieldIndex.has("m3_actual") ? line[fieldIndex.get("m3_actual")!] : null,
      ),
      m4_target: parseExcelDate(
        fieldIndex.has("m4_target") ? line[fieldIndex.get("m4_target")!] : null,
      ),
      m4_actual: parseExcelDate(
        fieldIndex.has("m4_actual") ? line[fieldIndex.get("m4_actual")!] : null,
      ),
      m5_target: parseExcelDate(
        fieldIndex.has("m5_target") ? line[fieldIndex.get("m5_target")!] : null,
      ),
      m5_actual: parseExcelDate(
        fieldIndex.has("m5_actual") ? line[fieldIndex.get("m5_actual")!] : null,
      ),
    });
  }

  return rows;
}

export type EnrolmentSheetSyncResult = {
  rowCount: number;
  uploadId: string;
};

export async function syncEnrolmentFromSharePoint(options?: {
  uploadedBy?: string;
}): Promise<EnrolmentSheetSyncResult> {
  if (!isMicrosoftGraphConfigured()) {
    throw new Error("Microsoft Graph is not configured");
  }

  const token = await getGraphToken();
  const buffer = await downloadEnrolmentWorkbook(token);
  const rows = mapWorkbookToEnrolmentRows(buffer);
  if (rows.length === 0) {
    throw new Error("No enrolment rows mapped from SharePoint workbook");
  }

  const published = await publishReportData({
    reportType: "enrolment_milestones",
    fileName: `sharepoint-enrolment-sync-${new Date().toISOString().slice(0, 10)}.xlsx`,
    rows,
    uploadedBy: options?.uploadedBy ?? "sharepoint-sync",
  });

  return {
    rowCount: published.rowCount,
    uploadId: published.uploadId,
  };
}
