"use client";

import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";
import { REPORT_TYPE_LABELS } from "@/lib/constants";
import { formatDateTime } from "@/lib/format";
import { Button } from "@/components/ui/button";

type Submission = {
  id: string;
  report_type: string;
  status: string;
  submitted_by: string;
  submitted_by_email: string;
  row_count: string;
  created_at: string;
};

const fetcher = (url: string) =>
  fetch(url).then(async (response) => {
    const body = (await response.json()) as { error?: string; submissions: Submission[] };
    if (!response.ok) throw new Error(body.error ?? "Failed to load");
    return body.submissions;
  });

export function ApprovalInbox() {
  const { data, error, isLoading, mutate } = useSWR<Submission[]>(
    "/api/submissions?scope=pending",
    fetcher,
  );
  const [actingId, setActingId] = useState<string | null>(null);

  const review = async (id: string, decision: "approved" | "rejected") => {
    setActingId(id);
    try {
      const response = await fetch(`/api/submissions/${id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "Review failed");
      await mutate();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Review failed");
    } finally {
      setActingId(null);
    }
  };

  if (isLoading) return <p className="text-sm text-slate-500">Loading pending submissions…</p>;
  if (error) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">
        {error.message}
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="rounded-lg border border-slate-200 bg-white p-6 text-sm text-slate-500">
        No submissions awaiting approval.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {data.map((submission) => (
        <div
          key={submission.id}
          className="rounded-lg border border-slate-200 bg-white p-4"
        >
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="font-semibold text-slate-900">
                {REPORT_TYPE_LABELS[submission.report_type as keyof typeof REPORT_TYPE_LABELS] ??
                  submission.report_type}
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Submitted by {submission.submitted_by} ({submission.submitted_by_email})
              </p>
              <p className="text-sm text-slate-500">
                {submission.row_count} rows · {formatDateTime(submission.created_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button href={`/approvals/${submission.id}`} variant="ghost">
                Review diff
              </Button>
              <Button
                onClick={() => review(submission.id, "approved")}
                disabled={actingId === submission.id}
              >
                Approve
              </Button>
              <Button
                variant="secondary"
                onClick={() => review(submission.id, "rejected")}
                disabled={actingId === submission.id}
              >
                Reject
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function ApprovalHistory() {
  const { data, error, isLoading } = useSWR<Submission[]>("/api/submissions", fetcher);

  if (isLoading) return null;
  if (error || !data) return null;

  const reviewed = data.filter((item) => item.status !== "pending");
  if (reviewed.length === 0) return null;

  return (
    <section className="mt-10">
      <h2 className="mb-4 text-sm font-semibold text-slate-800">Recent decisions</h2>
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-slate-600">
            <tr>
              <th className="px-3 py-2">Report</th>
              <th className="px-3 py-2">Submitted by</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Reviewed</th>
              <th className="px-3 py-2"> </th>
            </tr>
          </thead>
          <tbody>
            {reviewed.map((item) => (
              <tr key={item.id} className="border-b border-slate-100">
                <td className="px-3 py-2">
                  {REPORT_TYPE_LABELS[item.report_type as keyof typeof REPORT_TYPE_LABELS]}
                </td>
                <td className="px-3 py-2">{item.submitted_by_email}</td>
                <td className="px-3 py-2 capitalize">{item.status}</td>
                <td className="px-3 py-2">{formatDateTime(item.created_at)}</td>
                <td className="px-3 py-2">
                  <Link href={`/approvals/${item.id}`} className="text-emerald-700 hover:underline">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
