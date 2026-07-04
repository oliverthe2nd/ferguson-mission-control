import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin, getAuthUserId } from "@/lib/auth";
import { REPORT_TYPES, type ReportType } from "@/lib/constants";
import { revalidateDashboardData } from "@/lib/cached-queries";
import { requireDb } from "@/lib/db";
import { getPeriodDate, ParseError, validateReportData } from "@/lib/parse";
import { reportSnapshots, uploads } from "@/lib/schema";

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
    const validated = validateReportData(body.reportType, body.rows);
    const database = requireDb();

    const [upload] = await database
      .insert(uploads)
      .values({
        report_type: body.reportType,
        uploaded_by: admin.email || admin.id,
        file_name: body.fileName,
        row_count: String(validated.length),
      })
      .returning();

    const snapshotValues = validated.map((row) => ({
      upload_id: upload.id,
      report_type: body.reportType,
      period_date: getPeriodDate(
        body.reportType,
        row as Record<string, unknown>,
      ),
      data: row,
    }));

    await database.insert(reportSnapshots).values(snapshotValues);

    revalidateDashboardData(body.reportType);

    return NextResponse.json({
      success: true,
      uploadId: upload.id,
      rowCount: validated.length,
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
