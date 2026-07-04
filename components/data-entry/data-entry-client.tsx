"use client";

import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { EditableReportType } from "@/lib/constants";
import { REPORT_TYPE_LABELS } from "@/lib/constants";
import { SpreadsheetEditor } from "./spreadsheet-editor";

type DataEntryClientProps = {
  reportType: EditableReportType;
};

type DataEntryResponse = {
  rows: Record<string, unknown>[];
  lastUpload: { fileName: string; createdAt: string } | null;
  pendingSubmission: {
    id: string;
    submittedBy: string;
    submittedAt: string;
  } | null;
};

const fetcher = (url: string) =>
  fetch(url).then(async (response) => {
    const body = (await response.json()) as { error?: string } & DataEntryResponse;
    if (!response.ok) throw new Error(body.error ?? "Failed to load data");
    return body;
  });

export function DataEntryClient({ reportType }: DataEntryClientProps) {
  const router = useRouter();
  const { data, error, isLoading, mutate } = useSWR<DataEntryResponse>(
    `/api/data-entry/${reportType}`,
    fetcher,
  );

  const handleSubmit = async (
    rows: Record<string, unknown>[],
    baselineRows: Record<string, unknown>[],
  ) => {
    const response = await fetch("/api/submissions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportType, rows, baselineRows }),
    });

    const body = (await response.json()) as { error?: string };
    if (!response.ok) {
      throw new Error(body.error ?? "Submission failed");
    }

    await mutate();
    router.refresh();
  };

  if (isLoading) {
    return <p className="text-sm text-slate-500">Loading current data…</p>;
  }

  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {error.message}
      </p>
    );
  }

  const displayRows = data?.rows ?? [];

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <p className="font-medium text-slate-800">{REPORT_TYPE_LABELS[reportType]}</p>
        {data?.lastUpload ? (
          <p className="mt-1">
            Live data from <span className="font-medium">{data.lastUpload.fileName}</span>
          </p>
        ) : (
          <p className="mt-1">No live upload yet — start from a blank sheet or add rows.</p>
        )}
      </div>

      {data?.pendingSubmission && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          Submission pending since {new Date(data.pendingSubmission.submittedAt).toLocaleString("en-AU")}.
          {" "}
          <a href={`/approvals/${data.pendingSubmission.id}`} className="font-medium underline">
            View status
          </a>
        </div>
      )}

      <SpreadsheetEditor
        reportType={reportType}
        initialRows={displayRows}
        pendingSubmissionId={data?.pendingSubmission?.id}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
