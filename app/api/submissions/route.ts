import { NextResponse } from "next/server";
import { z } from "zod";
import { requireApprover, requireDataEntryAccess } from "@/lib/auth";
import { EDITABLE_REPORT_TYPES, isEditableReportType } from "@/lib/constants";
import { ParseError, validateReportData } from "@/lib/parse";
import {
  createPendingSubmission,
  listPendingSubmissions,
  listRecentSubmissions,
} from "@/lib/submissions";

const submitBodySchema = z.object({
  reportType: z.enum(EDITABLE_REPORT_TYPES),
  rows: z.array(z.record(z.string(), z.unknown())).min(1),
  baselineRows: z.array(z.record(z.string(), z.unknown())),
});

export async function GET(request: Request) {
  const user = await requireDataEntryAccess();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(request.url);
  const scope = searchParams.get("scope");

  try {
    if (scope === "pending" && (user.isApprover || user.role === "admin")) {
      const submissions = await listPendingSubmissions();
      return NextResponse.json({ submissions });
    }

    const submissions = await listRecentSubmissions();
    return NextResponse.json({ submissions });
  } catch (error) {
    console.error("List submissions error:", error);
    return NextResponse.json({ error: "Failed to load submissions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireDataEntryAccess();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = submitBodySchema.parse(await request.json());
    if (!isEditableReportType(body.reportType)) {
      return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
    }

    validateReportData(body.reportType, body.rows);

    const submission = await createPendingSubmission({
      reportType: body.reportType,
      rows: body.rows,
      baselineRows: body.baselineRows,
      submittedBy: user.name,
      submittedByEmail: user.email,
    });

    return NextResponse.json({
      success: true,
      submissionId: submission.id,
    });
  } catch (error) {
    if (error instanceof ParseError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error("Submit error:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
