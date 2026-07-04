"use client";

import { useCallback, useMemo, useState } from "react";
import type { EditableReportType } from "@/lib/constants";
import {
  emptyEditorRow,
  REPORT_COLUMNS,
  type ReportColumn,
} from "@/lib/report-columns";
import { editorToRows, rowsToEditor } from "@/lib/row-format";
import { Button } from "@/components/ui/button";

type SpreadsheetEditorProps = {
  reportType: EditableReportType;
  initialRows: Record<string, unknown>[];
  pendingSubmissionId?: string | null;
  onSubmit: (rows: Record<string, unknown>[], baselineRows: Record<string, unknown>[]) => Promise<void>;
};

function CellInput({
  column,
  value,
  onChange,
  disabled,
}: {
  column: ReportColumn;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  if (column.type === "enum" && column.options) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full min-w-[7rem] rounded border border-slate-200 bg-white px-2 py-1.5 text-sm disabled:bg-slate-50"
      >
        {column.options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type={column.type === "date" ? "date" : column.type === "number" ? "number" : "text"}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="w-full min-w-[6rem] rounded border border-slate-200 bg-white px-2 py-1.5 text-sm disabled:bg-slate-50"
    />
  );
}

export function SpreadsheetEditor({
  reportType,
  initialRows,
  pendingSubmissionId,
  onSubmit,
}: SpreadsheetEditorProps) {
  const columns = REPORT_COLUMNS[reportType];
  const baselineRows = useMemo(
    () => editorToRows(rowsToEditor(initialRows, columns), columns),
    [initialRows, columns],
  );

  const [rows, setRows] = useState<Record<string, string>[]>(() => {
    if (initialRows.length === 0) return [emptyEditorRow(reportType)];
    return rowsToEditor(initialRows, columns);
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const updateCell = useCallback(
    (rowIndex: number, key: string, value: string) => {
      setRows((current) =>
        current.map((row, index) =>
          index === rowIndex ? { ...row, [key]: value } : row,
        ),
      );
      setSuccess(false);
    },
    [],
  );

  const addRow = () => {
    setRows((current) => [...current, emptyEditorRow(reportType)]);
    setSuccess(false);
  };

  const removeRow = (index: number) => {
    setRows((current) => current.filter((_, i) => i !== index));
    setSuccess(false);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const parsed = editorToRows(rows, columns);
      if (parsed.length === 0) {
        throw new Error("Add at least one row with data before submitting.");
      }
      await onSubmit(parsed, baselineRows);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const isLocked = Boolean(pendingSubmissionId);

  return (
    <div className="space-y-4">
      {pendingSubmissionId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          A submission for this report is awaiting approval. Editing is locked until
          Oliver, Sarika, or Ian reviews it.
        </div>
      )}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-2 py-2 font-medium text-slate-600">
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-2 font-medium text-slate-600"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-slate-100">
                {columns.map((col) => (
                  <td key={col.key} className="px-2 py-1.5">
                    <CellInput
                      column={col}
                      value={row[col.key] ?? ""}
                      onChange={(value) => updateCell(rowIndex, col.key, value)}
                      disabled={isLocked}
                    />
                  </td>
                ))}
                <td className="px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => removeRow(rowIndex)}
                    disabled={isLocked}
                    className="text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-40"
                  >
                    Remove
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={addRow} disabled={isLocked}>
          Add row
        </Button>
        <Button onClick={handleSubmit} disabled={submitting || isLocked}>
          {submitting ? "Submitting…" : "Submit for approval"}
        </Button>
        <span className="text-sm text-slate-500">{rows.length} rows</span>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
          Submitted for approval. Oliver, Sarika, or Ian will review before changes go live.
        </p>
      )}
    </div>
  );
}
