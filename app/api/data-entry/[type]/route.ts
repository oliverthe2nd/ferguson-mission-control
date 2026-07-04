import { NextResponse } from "next/server";
import { requireDataEntryAccess } from "@/lib/auth";
import { isEditableReportType } from "@/lib/constants";
import { getEditableReportRows } from "@/lib/data-entry";
import { getPendingSubmissionForReport } from "@/lib/submissions";

type RouteContext = { params: Promise<{ type: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const user = await requireDataEntryAccess();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { type } = await context.params;
  if (!isEditableReportType(type)) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const [{ rows, upload }, pending] = await Promise.all([
      getEditableReportRows(type),
      getPendingSubmissionForReport(type),
    ]);

    return NextResponse.json({
      rows,
      lastUpload: upload
        ? { fileName: upload.file_name, createdAt: upload.created_at }
        : null,
      pendingSubmission: pending
        ? {
            id: pending.id,
            submittedBy: pending.submitted_by,
            submittedAt: pending.created_at,
          }
        : null,
    });
  } catch (error) {
    console.error("Data entry load error:", error);
    return NextResponse.json({ error: "Failed to load report data" }, { status: 500 });
  }
}
