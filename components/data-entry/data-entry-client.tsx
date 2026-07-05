"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import type { EditableReportType } from "@/lib/constants";
import { SpreadsheetEditor, type DataEntryMode } from "./spreadsheet-editor";

type DataEntryClientProps = {
  reportType: EditableReportType;
  mode?: DataEntryMode;
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

export function DataEntryClient({ reportType, mode = "full" }: DataEntryClientProps) {
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
    return <p className="text-sm text-slate-500">Loading…</p>;
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
    <div className="space-y-3">
      {data?.pendingSubmission && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Pending approval since{" "}
          {new Date(data.pendingSubmission.submittedAt).toLocaleString("en-AU")}.{" "}
          <a href={`/approvals/${data.pendingSubmission.id}`} className="font-medium underline">
            View
          </a>
        </div>
      )}

      <SpreadsheetEditor
        key={mode}
        reportType={reportType}
        initialRows={displayRows}
        mode={mode}
        basePath={`/data-entry/${reportType}`}
        lastUpload={data?.lastUpload ?? null}
        pendingSubmissionId={data?.pendingSubmission?.id}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
