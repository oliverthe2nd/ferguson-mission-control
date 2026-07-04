"use client";

import * as XLSX from "xlsx";
import type { ReportType } from "./constants";
import { ALLOWED_UPLOAD_EXTENSIONS, MAX_UPLOAD_BYTES } from "./constants";

export function parseSpreadsheetFile(file: File): Promise<Record<string, unknown>[]> {
  return new Promise((resolve, reject) => {
    const extension = file.name
      .slice(file.name.lastIndexOf("."))
      .toLowerCase();

    if (
      !ALLOWED_UPLOAD_EXTENSIONS.includes(
        extension as (typeof ALLOWED_UPLOAD_EXTENSIONS)[number],
      )
    ) {
      reject(new Error("Only .xlsx and .csv files are allowed"));
      return;
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      reject(new Error("File exceeds 10MB limit"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
          defval: null,
        });
        resolve(rows);
      } catch {
        reject(new Error("Failed to parse spreadsheet"));
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsArrayBuffer(file);
  });
}

export async function uploadReportData(
  reportType: ReportType,
  fileName: string,
  rows: unknown[],
) {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportType, fileName, rows }),
  });

  if (!response.ok) {
    const body = (await response.json()) as { error?: string };
    throw new Error(body.error ?? "Upload failed");
  }

  return response.json();
}
