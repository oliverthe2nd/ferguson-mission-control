import { and, desc, eq } from "drizzle-orm";
import type { EditableReportType } from "./constants";
import { requireDb } from "./db";
import { publishReportData } from "./publish-report";
import { pendingSubmissions } from "./schema";

export type SubmissionStatus = "pending" | "approved" | "rejected";

export type SubmissionRecord = typeof pendingSubmissions.$inferSelect;

export async function getPendingSubmissionForReport(reportType: EditableReportType) {
  const database = requireDb();
  const [row] = await database
    .select()
    .from(pendingSubmissions)
    .where(
      and(
        eq(pendingSubmissions.report_type, reportType),
        eq(pendingSubmissions.status, "pending"),
      ),
    )
    .orderBy(desc(pendingSubmissions.created_at))
    .limit(1);
  return row ?? null;
}

export async function createPendingSubmission({
  reportType,
  rows,
  baselineRows,
  submittedBy,
  submittedByEmail,
}: {
  reportType: EditableReportType;
  rows: unknown[];
  baselineRows: unknown[];
  submittedBy: string;
  submittedByEmail: string;
}) {
  const existing = await getPendingSubmissionForReport(reportType);
  if (existing) {
    throw new Error(
      "A submission for this report is already awaiting approval. Please wait for review or contact an approver.",
    );
  }

  const database = requireDb();
  const [submission] = await database
    .insert(pendingSubmissions)
    .values({
      report_type: reportType,
      status: "pending",
      submitted_by: submittedBy,
      submitted_by_email: submittedByEmail,
      row_count: String(rows.length),
      rows,
      baseline_rows: baselineRows,
    })
    .returning();

  return submission;
}

export async function listPendingSubmissions() {
  const database = requireDb();
  return database
    .select()
    .from(pendingSubmissions)
    .where(eq(pendingSubmissions.status, "pending"))
    .orderBy(desc(pendingSubmissions.created_at));
}

export async function listRecentSubmissions(limit = 20) {
  const database = requireDb();
  return database
    .select()
    .from(pendingSubmissions)
    .orderBy(desc(pendingSubmissions.created_at))
    .limit(limit);
}

export async function getSubmissionById(id: string) {
  const database = requireDb();
  const [row] = await database
    .select()
    .from(pendingSubmissions)
    .where(eq(pendingSubmissions.id, id))
    .limit(1);
  return row ?? null;
}

export async function reviewSubmission({
  id,
  decision,
  reviewerName,
  reviewerEmail,
  comment,
}: {
  id: string;
  decision: "approved" | "rejected";
  reviewerName: string;
  reviewerEmail: string;
  comment?: string;
}) {
  const submission = await getSubmissionById(id);
  if (!submission) {
    throw new Error("Submission not found");
  }
  if (submission.status !== "pending") {
    throw new Error("This submission has already been reviewed");
  }

  const database = requireDb();

  if (decision === "approved") {
    const fileName = `data-entry-${submission.report_type}-${new Date().toISOString().slice(0, 10)}.csv`;
    await publishReportData({
      reportType: submission.report_type as EditableReportType,
      fileName,
      rows: submission.rows as unknown[],
      uploadedBy: `${reviewerEmail} (approved ${submission.submitted_by_email})`,
    });
  }

  const [updated] = await database
    .update(pendingSubmissions)
    .set({
      status: decision,
      reviewed_by: reviewerName,
      reviewed_by_email: reviewerEmail,
      review_comment: comment ?? null,
      reviewed_at: new Date(),
    })
    .where(eq(pendingSubmissions.id, id))
    .returning();

  return updated;
}

export function countChangedCells(
  baseline: Record<string, unknown>[],
  proposed: Record<string, unknown>[],
): number {
  const baselineJson = JSON.stringify(baseline);
  const proposedJson = JSON.stringify(proposed);
  if (baselineJson === proposedJson) return 0;

  const maxLen = Math.max(baseline.length, proposed.length);
  let changes = 0;

  for (let i = 0; i < maxLen; i += 1) {
    if (JSON.stringify(baseline[i] ?? {}) !== JSON.stringify(proposed[i] ?? {})) {
      changes += 1;
    }
  }

  return changes;
}
