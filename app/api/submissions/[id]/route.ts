import { NextResponse } from "next/server";
import { requireApprover, requireDataEntryAccess } from "@/lib/auth";
import { getSubmissionById } from "@/lib/submissions";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireDataEntryAccess();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const submission = await getSubmissionById(id);
    if (!submission) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const canReview = user.isApprover || user.role === "admin";
    const isSubmitter =
      submission.submitted_by_email.toLowerCase() === user.email.toLowerCase();

    if (!canReview && !isSubmitter && submission.status === "pending") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ submission });
  } catch (error) {
    console.error("Get submission error:", error);
    return NextResponse.json({ error: "Failed to load submission" }, { status: 500 });
  }
}
