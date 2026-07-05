"use client";

import { Plus } from "lucide-react";
import { useCallback, useMemo, useRef, useState } from "react";
import type { EditableReportType } from "@/lib/constants";
import {
  emptyEditorRow,
  REPORT_COLUMNS,
  type ReportColumn,
} from "@/lib/report-columns";
import {
  baselineRowSignatures,
  editorToRows,
  isEditorRowEmpty,
  rowSignature,
  rowsToEditor,
} from "@/lib/row-format";
import { Button } from "@/components/ui/button";
import { EdgeScrollContainer } from "@/components/ui/edge-scroll-container";

export type DataEntryMode = "full" | "append";

type SpreadsheetEditorProps = {
  reportType: EditableReportType;
  initialRows: Record<string, unknown>[];
  mode?: DataEntryMode;
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

const APPEND_START_ROWS = 3;

export function SpreadsheetEditor({
  reportType,
  initialRows,
  mode = "full",
  pendingSubmissionId,
  onSubmit,
}: SpreadsheetEditorProps) {
  const columns = REPORT_COLUMNS[reportType];
  const isAppendMode = mode === "append";
  const baselineRows = useMemo(
    () => editorToRows(rowsToEditor(initialRows, columns), columns),
    [initialRows, columns],
  );
  const baselineSignatures = useMemo(
    () => baselineRowSignatures(initialRows, columns),
    [initialRows, columns],
  );

  const [rows, setRows] = useState<Record<string, string>[]>(() => {
    if (isAppendMode) {
      return Array.from({ length: APPEND_START_ROWS }, () => emptyEditorRow(reportType));
    }
    if (initialRows.length === 0) return [emptyEditorRow(reportType)];
    return rowsToEditor(initialRows, columns);
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const rowRefs = useRef<Map<number, HTMLTableRowElement>>(new Map());

  const scrollToRow = useCallback((index: number) => {
    requestAnimationFrame(() => {
      rowRefs.current.get(index)?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }, []);

  const updateCell = useCallback(
    (rowIndex: number, key: string, value: string) => {
      setRows((current) => {
        const next = current.map((row, index) =>
          index === rowIndex ? { ...row, [key]: value } : row,
        );

        if (isAppendMode && rowIndex === next.length - 1 && value.trim() !== "") {
          next.push(emptyEditorRow(reportType));
        }

        return next;
      });
      setSuccess(false);
    },
    [isAppendMode, reportType],
  );

  const addRow = useCallback(() => {
    setRows((current) => {
      const next = [...current, emptyEditorRow(reportType)];
      scrollToRow(next.length - 1);
      return next;
    });
    setSuccess(false);
  }, [reportType, scrollToRow]);

  const removeRow = (index: number) => {
    setRows((current) => {
      if (isAppendMode && current.length <= 1) {
        return [emptyEditorRow(reportType)];
      }
      return current.filter((_, i) => i !== index);
    });
    setSuccess(false);
  };

  const isNewRow = useCallback(
    (row: Record<string, string>) => {
      if (isEditorRowEmpty(row, columns)) return false;
      return !baselineSignatures.has(rowSignature(row, columns));
    },
    [baselineSignatures, columns],
  );

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    setSuccess(false);
    try {
      const parsedNew = editorToRows(rows, columns);

      if (isAppendMode) {
        if (parsedNew.length === 0) {
          throw new Error("Add at least one new entry before submitting.");
        }
        await onSubmit([...baselineRows, ...parsedNew], baselineRows);
      } else {
        if (parsedNew.length === 0) {
          throw new Error("Add at least one row with data before submitting.");
        }
        await onSubmit(parsedNew, baselineRows);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const isLocked = Boolean(pendingSubmissionId);
  const newRowCount = rows.filter((row) => isNewRow(row)).length;

  return (
    <div className="space-y-4">
      {pendingSubmissionId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          A submission for this report is awaiting approval. Editing is locked until
          Oliver, Sarika, or Ian reviews it.
        </div>
      )}

      {isAppendMode && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
          Add new entries only — existing {baselineRows.length} live row
          {baselineRows.length === 1 ? "" : "s"} stay unchanged and are merged on approval.
        </div>
      )}

      <div className="sticky top-20 z-[5] flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white/95 p-3 shadow-sm backdrop-blur-sm">
        <div className="text-sm text-slate-600">
          {isAppendMode ? (
            <span>
              {newRowCount} new {newRowCount === 1 ? "entry" : "entries"} ready to submit
            </span>
          ) : (
            <span>
              {rows.length} rows
              {newRowCount > 0 && (
                <span className="ml-2 text-emerald-700">· {newRowCount} new</span>
              )}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={addRow} disabled={isLocked}>
            <Plus className="mr-1.5 h-4 w-4" />
            Add new entry
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || isLocked}>
            {submitting ? "Submitting…" : "Submit for approval"}
          </Button>
        </div>
      </div>

      <EdgeScrollContainer className="max-h-[min(65vh,40rem)] rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 z-[1] border-b border-slate-200 bg-slate-50">
            <tr>
              {!isAppendMode && (
                <th className="w-10 px-2 py-2 font-medium text-slate-600">#</th>
              )}
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-2 py-2 font-medium text-slate-600">
                  {col.label}
                </th>
              ))}
              <th className="px-2 py-2 font-medium text-slate-600"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => {
              const isNew = isNewRow(row);
              return (
                <tr
                  key={rowIndex}
                  ref={(el) => {
                    if (el) rowRefs.current.set(rowIndex, el);
                    else rowRefs.current.delete(rowIndex);
                  }}
                  className={
                    isNew
                      ? "border-b border-emerald-100 bg-emerald-50/60"
                      : "border-b border-slate-100"
                  }
                >
                  {!isAppendMode && (
                    <td className="px-2 py-1.5 text-xs text-slate-400">{rowIndex + 1}</td>
                  )}
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
              );
            })}
          </tbody>
        </table>
      </EdgeScrollContainer>

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
