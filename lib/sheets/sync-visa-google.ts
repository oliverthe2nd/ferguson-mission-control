/**
 * Google Sheets sync for the Visa Team tracker.
 *
 * Env:
 * - GOOGLE_SERVICE_ACCOUNT_JSON — full service account JSON string
 *   (or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)
 * - VISA_SHEET_ID — default: Ferguson visa tracker spreadsheet
 * - VISA_SHEET_GID — worksheet gid (default 551936853)
 * - VISA_SHEET_RANGE — optional A1 range override (e.g. "'Sheet1'!A1:Z")
 */

import { publishReportData } from "@/lib/publish-report";
import type { VisaLodgementRow } from "@/lib/validators/visa-lodgement";

export const DEFAULT_VISA_SHEET_ID =
  "1DYOQjU2Dt5n0l4npl-T1lKecpQAoDJ7VH_o6ib1QZ4A";
export const DEFAULT_VISA_SHEET_GID = "551936853";

type ServiceAccount = {
  client_email: string;
  private_key: string;
  token_uri?: string;
};

export function isGoogleSheetsConfigured(): boolean {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return true;
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
  );
}

function loadServiceAccount(): ServiceAccount {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON) as ServiceAccount;
  }
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n",
  );
  if (!email || !key) {
    throw new Error("Google service account credentials are not configured");
  }
  return { client_email: email, private_key: key };
}

function base64url(input: ArrayBuffer | string): string {
  const bytes =
    typeof input === "string"
      ? new TextEncoder().encode(input)
      : new Uint8Array(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function getGoogleAccessToken(): Promise<string> {
  const sa = loadServiceAccount();
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = base64url(
    JSON.stringify({
      iss: sa.client_email,
      scope: "https://www.googleapis.com/auth/spreadsheets.readonly",
      aud: sa.token_uri ?? "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    }),
  );
  const unsigned = `${header}.${claim}`;

  const pem = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    new TextEncoder().encode(unsigned),
  );
  const jwt = `${unsigned}.${base64url(signature)}`;

  const response = await fetch(
    sa.token_uri ?? "https://oauth2.googleapis.com/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }),
    },
  );
  const body = (await response.json()) as {
    access_token?: string;
    error?: string;
    error_description?: string;
  };
  if (!response.ok || !body.access_token) {
    throw new Error(
      body.error_description ?? body.error ?? "Google token exchange failed",
    );
  }
  return body.access_token;
}

async function resolveSheetTitle(
  spreadsheetId: string,
  gid: string,
  token: string,
): Promise<string> {
  const meta = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const body = (await meta.json()) as {
    sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
    error?: { message?: string };
  };
  if (!meta.ok) {
    throw new Error(body.error?.message ?? "Failed to read spreadsheet metadata");
  }
  const targetGid = Number(gid);
  const match = body.sheets?.find((s) => s.properties?.sheetId === targetGid);
  const title = match?.properties?.title;
  if (!title) {
    throw new Error(`Worksheet gid ${gid} not found in spreadsheet`);
  }
  return title;
}

function headerKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

const COLUMN_ALIASES: Record<keyof VisaLodgementRow, string[]> = {
  period: ["period", "week", "week_start", "date", "period_start"],
  visa_subclass: [
    "visa_subclass",
    "subclass",
    "visa",
    "visa_type",
    "stream",
  ],
  lodged_count: ["lodged_count", "lodged", "lodgements", "visa_lodged"],
  refused_count: ["refused_count", "refused", "refusals"],
  processing_count: ["processing_count", "processing", "in_processing"],
  pending_actions_count: [
    "pending_actions_count",
    "pending_actions",
    "pending",
  ],
  pending_s56: ["pending_s56", "s56", "s_56"],
  pending_biometrics: ["pending_biometrics", "biometrics"],
  pending_medicals: ["pending_medicals", "medicals"],
  avg_days_file_to_lodgement: [
    "avg_days_file_to_lodgement",
    "avg_days",
    "turnaround",
    "avg_turnaround",
  ],
};

function mapHeaderIndexes(headers: string[]): Partial<
  Record<keyof VisaLodgementRow, number>
> {
  const normalized = headers.map(headerKey);
  const indexes: Partial<Record<keyof VisaLodgementRow, number>> = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES) as Array<
    [keyof VisaLodgementRow, string[]]
  >) {
    const idx = normalized.findIndex((h) => aliases.includes(h));
    if (idx >= 0) indexes[field] = idx;
  }
  return indexes;
}

function cellNumber(value: unknown): number {
  if (value == null || value === "") return 0;
  const n = Number(String(value).replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function cellDate(value: unknown): Date | null {
  if (value == null || value === "") return null;
  if (typeof value === "number") {
    // Sheets serial date
    const utc = Date.UTC(1899, 11, 30) + value * 86400000;
    return new Date(utc);
  }
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function rowsFromValues(values: string[][]): VisaLodgementRow[] {
  if (values.length < 2) return [];
  const headers = values[0]!.map(String);
  const indexes = mapHeaderIndexes(headers);
  if (indexes.period == null || indexes.visa_subclass == null) {
    throw new Error(
      "Visa sheet must include period/date and visa_subclass (or alias) columns",
    );
  }

  const rows: VisaLodgementRow[] = [];
  for (const line of values.slice(1)) {
    if (!line.some((cell) => String(cell ?? "").trim())) continue;
    const period = cellDate(line[indexes.period!]);
    const subclass = String(line[indexes.visa_subclass!] ?? "").trim();
    if (!period || !subclass) continue;

    rows.push({
      period,
      visa_subclass: subclass,
      lodged_count: cellNumber(
        indexes.lodged_count != null ? line[indexes.lodged_count] : 0,
      ),
      refused_count: cellNumber(
        indexes.refused_count != null ? line[indexes.refused_count] : 0,
      ),
      processing_count: cellNumber(
        indexes.processing_count != null ? line[indexes.processing_count] : 0,
      ),
      pending_actions_count: cellNumber(
        indexes.pending_actions_count != null
          ? line[indexes.pending_actions_count]
          : 0,
      ),
      pending_s56: cellNumber(
        indexes.pending_s56 != null ? line[indexes.pending_s56] : 0,
      ),
      pending_biometrics: cellNumber(
        indexes.pending_biometrics != null
          ? line[indexes.pending_biometrics]
          : 0,
      ),
      pending_medicals: cellNumber(
        indexes.pending_medicals != null ? line[indexes.pending_medicals] : 0,
      ),
      avg_days_file_to_lodgement: cellNumber(
        indexes.avg_days_file_to_lodgement != null
          ? line[indexes.avg_days_file_to_lodgement]
          : 0,
      ),
    });
  }
  return rows;
}

export type VisaSheetSyncResult = {
  rowCount: number;
  uploadId: string;
  spreadsheetId: string;
  sheetTitle: string;
};

export async function syncVisaLodgementFromGoogleSheet(options?: {
  uploadedBy?: string;
  spreadsheetId?: string;
  gid?: string;
}): Promise<VisaSheetSyncResult> {
  if (!isGoogleSheetsConfigured()) {
    throw new Error("Google Sheets is not configured");
  }

  const spreadsheetId =
    options?.spreadsheetId ??
    process.env.VISA_SHEET_ID ??
    DEFAULT_VISA_SHEET_ID;
  const gid =
    options?.gid ?? process.env.VISA_SHEET_GID ?? DEFAULT_VISA_SHEET_GID;
  const token = await getGoogleAccessToken();
  const sheetTitle = await resolveSheetTitle(spreadsheetId, gid, token);
  const range =
    process.env.VISA_SHEET_RANGE ??
    `'${sheetTitle.replace(/'/g, "''")}'!A1:Z1000`;

  const encodedRange = encodeURIComponent(range);
  const valuesRes = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodedRange}?valueRenderOption=UNFORMATTED_VALUE&dateTimeRenderOption=FORMATTED_STRING`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  const valuesBody = (await valuesRes.json()) as {
    values?: string[][];
    error?: { message?: string };
  };
  if (!valuesRes.ok) {
    throw new Error(valuesBody.error?.message ?? "Failed to read sheet values");
  }

  const rows = rowsFromValues(valuesBody.values ?? []);
  if (rows.length === 0) {
    throw new Error("No visa rows mapped from Google Sheet");
  }

  const published = await publishReportData({
    reportType: "visa_lodgement",
    fileName: `google-visa-sync-${new Date().toISOString().slice(0, 10)}.json`,
    rows,
    uploadedBy: options?.uploadedBy ?? "google-sheets-sync",
  });

  return {
    rowCount: published.rowCount,
    uploadId: published.uploadId,
    spreadsheetId,
    sheetTitle,
  };
}
