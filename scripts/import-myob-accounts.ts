import * as fs from "node:fs";
import * as path from "node:path";
import * as XLSX from "xlsx";
import { DEMO_USER } from "../lib/demo-user";
import {
  isMyobUnpaidInvoicesSheet,
  parseMyobUnpaidInvoicesRows,
} from "../lib/parsers/myob-unpaid-invoices";
import { publishReportData } from "../lib/publish-report";

const defaultPath = path.join(
  process.cwd(),
  "data/accounts/myob-unpaid-invoices-2026-07-06.xlsx",
);

function loadMyobRows(filePath: string) {
  const buffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: "",
  });

  if (!isMyobUnpaidInvoicesSheet(matrix)) {
    throw new Error(`Not a MYOB unpaid invoices report: ${filePath}`);
  }

  return parseMyobUnpaidInvoicesRows(matrix);
}

async function main() {
  const filePath = path.resolve(process.argv[2] ?? defaultPath);
  const rows = loadMyobRows(filePath);

  const result = await publishReportData({
    reportType: "accounts_receivable",
    fileName: path.basename(filePath),
    rows,
    uploadedBy: DEMO_USER.email,
  });

  console.log(
    `Imported ${result.rowCount} accounts receivable rows from ${path.basename(filePath)}`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
