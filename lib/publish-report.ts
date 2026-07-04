import type { ReportType } from "./constants";
import { revalidateDashboardData } from "./cached-queries";
import { requireDb } from "./db";
import { getPeriodDate, validateReportData } from "./parse";
import { reportSnapshots, uploads } from "./schema";

export async function publishReportData({
  reportType,
  fileName,
  rows,
  uploadedBy,
}: {
  reportType: ReportType;
  fileName: string;
  rows: unknown[];
  uploadedBy: string;
}) {
  const validated = validateReportData(reportType, rows);
  const database = requireDb();

  const [upload] = await database
    .insert(uploads)
    .values({
      report_type: reportType,
      uploaded_by: uploadedBy,
      file_name: fileName,
      row_count: String(validated.length),
    })
    .returning();

  const snapshotValues = validated.map((row) => ({
    upload_id: upload.id,
    report_type: reportType,
    period_date: getPeriodDate(reportType, row as Record<string, unknown>),
    data: row,
  }));

  await database.insert(reportSnapshots).values(snapshotValues);
  revalidateDashboardData(reportType);

  return { uploadId: upload.id, rowCount: validated.length };
}
