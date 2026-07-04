import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import type { ReportType } from "../lib/constants";
import { requireDb } from "../lib/db";
import { getPeriodDate, validateReportData } from "../lib/parse";
import { reportSnapshots, uploads } from "../lib/schema";
import { DEMO_USER } from "../lib/demo-user";

function parseCsv(filePath: string): Record<string, unknown>[] {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: null,
  });
}

function filterRows(reportType: ReportType, rows: Record<string, unknown>[]) {
  if (reportType !== "visa_lodgement") return rows;

  return rows.filter((row) => {
    const period = row.period;
    if (period == null || period === "") return false;
    const iso = period instanceof Date ? period.toISOString().slice(0, 10) : String(period);
    return iso !== "1969-12-30";
  });
}

async function uploadCsv(reportType: ReportType, filePath: string) {
  const absolutePath = path.resolve(filePath);
  const fileName = path.basename(absolutePath);
  const rawRows = parseCsv(absolutePath);
  const rows = filterRows(reportType, rawRows);
  const validated = validateReportData(reportType, rows);
  const database = requireDb();

  const [upload] = await database
    .insert(uploads)
    .values({
      report_type: reportType,
      uploaded_by: DEMO_USER.email,
      file_name: fileName,
      row_count: String(validated.length),
    })
    .returning();

  await database.insert(reportSnapshots).values(
    validated.map((row) => ({
      upload_id: upload.id,
      report_type: reportType,
      period_date: getPeriodDate(reportType, row as Record<string, unknown>),
      data: row,
    })),
  );

  console.log(`Uploaded ${fileName}: ${validated.length} rows (${reportType})`);
  return validated.length;
}

async function main() {
  const root = process.cwd();
  const targets: Array<[ReportType, string]> = [];

  const only = process.argv[2];
  if (!only || only === "visa") {
    targets.push(["visa_lodgement", path.join(root, "public/templates/visa-lodgement.csv")]);
  }
  if (!only || only === "enrolment") {
    targets.push([
      "enrolment_milestones",
      path.join(root, "public/templates/enrolment-milestones.csv"),
    ]);
  }

  for (const [reportType, filePath] of targets) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Missing file: ${filePath}`);
    }
    await uploadCsv(reportType, filePath);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
