"use client";

import { useState } from "react";
import useSWR from "swr";
import { useRouter } from "next/navigation";
import {
  isEditableReportType,
  REPORT_TYPE_LABELS,
  type EditableReportType,
} from "@/lib/constants";
import { REPORT_COLUMNS } from "@/lib/report-columns";
import { rowToEditor } from "@/lib/row-format";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

type SubmissionDetail = {
  id: string;
  report_type: string;
  status: string;
  submitted_by: string;
  submitted_by_email: string;
  rows: Record<string, unknown>[];
  baseline_rows: Record<string, unknown>[] | null;
  review_comment: string | null;
  reviewed_by: string | null;
  reviewed_by_email: string | null;
  reviewed_at: string | null;
};

const fetcher = (url: string) =>
  fetch(url).then(async (response) => {
    const body = (await response.json()) as { error?: string; submission: SubmissionDetail };
    if (!response.ok) throw new Error(body.error ?? "Failed to load");
    return body.submission;
  });

export function SubmissionReview({
  submissionId,
  canReview,
}: {
  submissionId: string;
  canReview: boolean;
}) {
  const router = useRouter();
  const { data, error, isLoading } = useSWR<SubmissionDetail>(
    `/api/submissions/${submissionId}`,
    fetcher,
  );
  const [acting, setActing] = useState(false);
  const [comment, setComment] = useState("");

  const review = async (decision: "approved" | "rejected") => {
    setActing(true);
    try {
      const response = await fetch(`/api/submissions/${submissionId}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment: comment || undefined }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Review failed");
      router.push("/approvals");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Review failed");
    } finally {
      setActing(false);
    }
  };

  if (isLoading) return <p className="text-sm text-slate-500">Loading submission…</p>;
  if (error || !data) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {error?.message ?? "Submission not found"}
      </p>
    );
  }

  if (!isEditableReportType(data.report_type)) {
    return <p className="text-sm text-red-700">Unsupported report type.</p>;
  }

  const reportType = data.report_type as EditableReportType;
  const columns = REPORT_COLUMNS[reportType];
  const baseline = data.baseline_rows ?? [];
  const proposed = data.rows;

  const maxRows = Math.max(baseline.length, proposed.length);
  const changedRowIndexes = new Set<number>();
  for (let i = 0; i < maxRows; i += 1) {
    if (JSON.stringify(baseline[i] ?? {}) !== JSON.stringify(proposed[i] ?? {})) {
      changedRowIndexes.add(i);
    }
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        <p className="font-semibold text-slate-900">
          {REPORT_TYPE_LABELS[reportType]}
        </p>
        <p className="mt-1 text-slate-600">
          Submitted by {data.submitted_by} ({data.submitted_by_email})
        </p>
        <p className="capitalize text-slate-500">Status: {data.status}</p>
        {data.reviewed_at && (
          <p className="mt-1 text-slate-600">
            {data.status === "approved" ? "Approved" : "Rejected"} by{" "}
            {data.reviewed_by ?? data.reviewed_by_email} on{" "}
            {formatDateTime(data.reviewed_at)}
          </p>
        )}
        {data.review_comment && (
          <p className="mt-2 text-slate-600">Comment: {data.review_comment}</p>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50">
            <tr>
              <th className="px-2 py-2 font-medium text-slate-600">#</th>
              {columns.map((col) => (
                <th key={col.key} className="whitespace-nowrap px-2 py-2 font-medium text-slate-600">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: maxRows }, (_, index) => {
              const isChanged = changedRowIndexes.has(index);
              const proposedRow = rowToEditor(proposed[index] ?? {}, columns);
              const baselineRow = rowToEditor(baseline[index] ?? {}, columns);

              return (
                <tr
                  key={index}
                  className={isChanged ? "bg-amber-50" : "border-b border-slate-100"}
                >
                  <td className="px-2 py-2 text-slate-500">{index + 1}</td>
                  {columns.map((col) => {
                    const next = proposedRow[col.key] ?? "";
                    const prev = baselineRow[col.key] ?? "";
                    const cellChanged = next !== prev;

                    return (
                      <td key={col.key} className="px-2 py-2 align-top">
                        {cellChanged ? (
                          <div>
                            {prev && (
                              <p className="text-xs text-slate-400 line-through">{prev}</p>
                            )}
                            <p className="font-medium text-amber-900">{next || "—"}</p>
                          </div>
                        ) : (
                          <span className="text-slate-700">{next || "—"}</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {data.status === "pending" && canReview && (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-white p-4">
          <label className="block text-sm font-medium text-slate-700">
            Review comment (optional)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => review("approved")} disabled={acting}>
              Approve and publish
            </Button>
            <Button variant="secondary" onClick={() => review("rejected")} disabled={acting}>
              Reject
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
