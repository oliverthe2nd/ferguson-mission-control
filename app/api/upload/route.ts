import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, getAuthUserId } from "@/lib/auth";
import { REPORT_TYPES, type ReportType } from "@/lib/constants";
import { publishReportData } from "@/lib/publish-report";
import { ParseError } from "@/lib/parse";

const uploadBodySchema = z.object({
  reportType: z.enum(REPORT_TYPES),
  fileName: z.string().min(1),
  rows: z.array(z.record(z.string(), z.unknown())).min(1),
});

export async function POST(request: Request) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  try {
    const body = uploadBodySchema.parse(await request.json());
    const result = await publishReportData({
      reportType: body.reportType as ReportType,
      fileName: body.fileName,
      rows: body.rows,
      uploadedBy: admin.email || admin.id,
    });

    return NextResponse.json({
      success: true,
      uploadId: result.uploadId,
      rowCount: result.rowCount,
    });
  } catch (error) {
    if (error instanceof ParseError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
