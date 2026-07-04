"use client";

import { useCallback, useState } from "react";
import type { ReportType } from "@/lib/constants";
import { REPORT_TYPE_LABELS, REPORT_TYPES } from "@/lib/constants";
import { parseSpreadsheetFile, uploadReportData } from "@/lib/client-upload";
import { Button } from "@/components/ui/button";
import { PreviewTable } from "./preview-table";

export function UploadForm() {
  const [reportType, setReportType] = useState<ReportType>("sales_pipeline");
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleFile = useCallback(async (file: File) => {
    setError("");
    setSuccess(false);
    try {
      const parsed = await parseSpreadsheetFile(file);
      setFileName(file.name);
      setRows(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
      setRows([]);
    }
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const file = event.dataTransfer.files[0];
      if (file) void handleFile(file);
    },
    [handleFile],
  );

  const onConfirm = async () => {
    setUploading(true);
    setError("");
    try {
      await uploadReportData(reportType, fileName, rows);
      setSuccess(true);
      setRows([]);
      setFileName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Report type
        </label>
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as ReportType)}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          {REPORT_TYPES.map((type) => (
            <option key={type} value={type}>
              {REPORT_TYPE_LABELS[type]}
            </option>
          ))}
        </select>
      </div>

      <div
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="rounded-lg border-2 border-dashed border-slate-300 bg-white p-8 text-center"
      >
        <p className="text-sm text-slate-600">
          Drag and drop a .xlsx or .csv file here, or
        </p>
        <label className="mt-3 inline-block cursor-pointer rounded-lg bg-emerald px-4 py-2 text-sm font-medium text-white hover:bg-emerald/90">
          Browse files
          <input
            type="file"
            accept=".xlsx,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
            }}
          />
        </label>
        {fileName && (
          <p className="mt-3 text-sm text-slate-500">
            Selected: {fileName} ({rows.length} rows)
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-emerald/30 bg-mint p-3 text-sm text-emerald">
          Upload successful. Dashboard will reflect new data shortly.
        </div>
      )}

      {rows.length > 0 && (
        <>
          <PreviewTable rows={rows} />
          <div className="flex gap-3">
            <Button onClick={onConfirm} disabled={uploading}>
              {uploading ? "Uploading…" : "Confirm upload"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setRows([]);
                setFileName("");
              }}
            >
              Clear
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
