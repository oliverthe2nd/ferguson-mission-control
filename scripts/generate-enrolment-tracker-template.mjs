import { writeFileSync, copyFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import XLSX from "xlsx";

const COLUMNS = [
  { group: "CLIENT INFORMATION", header: "Case Officer" },
  { group: "CLIENT INFORMATION", header: "Client Name" },
  { group: "CLIENT INFORMATION", header: "Client ID" },
  { group: "CLIENT INFORMATION", header: "Date Registered" },
  { group: "CLIENT INFORMATION", header: "Email Address" },
  { group: "CLIENT INFORMATION", header: "Phone Number" },
  { group: "CLIENT INFORMATION", header: "Country of Passport" },
  { group: "CLIENT INFORMATION", header: "Offshore/Onshore" },
  { group: "PRE ENROLMENT", header: "Sent Intro Email" },
  { group: "PRE ENROLMENT", header: "Completed Initial Documents" },
  { group: "PRE ENROLMENT", header: "Started Course Discussions" },
  { group: "COURSE INFORMATION", header: "Course" },
  { group: "COURSE INFORMATION", header: "School" },
  { group: "COURSE INFORMATION", header: "Intake" },
  { group: "FEE MILESTONES (Mission Control)", header: "M1 First Consult — Due" },
  { group: "FEE MILESTONES (Mission Control)", header: "M1 First Consult — Paid" },
  { group: "FEE MILESTONES (Mission Control)", header: "M2 Tuition / School Deposit — Due" },
  { group: "FEE MILESTONES (Mission Control)", header: "M2 Tuition / School Deposit — Paid" },
  { group: "FEE MILESTONES (Mission Control)", header: "M3 Visa Lodgement Fee — Due" },
  { group: "FEE MILESTONES (Mission Control)", header: "M3 Visa Lodgement Fee — Paid" },
  { group: "FEE MILESTONES (Mission Control)", header: "M4 OSHC — Due" },
  { group: "FEE MILESTONES (Mission Control)", header: "M4 OSHC — Paid" },
  { group: "FEE MILESTONES (Mission Control)", header: "M5 Second Consult — Due" },
  { group: "FEE MILESTONES (Mission Control)", header: "M5 Second Consult — Paid" },
  { group: "NOTES", header: "Remarks" },
];

const DATE_HEADERS = new Set(
  COLUMNS.filter((col) =>
    /Date Registered|Intro Email|Initial Documents|Course Discussions|Intake|Due|Paid/.test(
      col.header,
    ),
  ).map((col) => col.header),
);

function dateCell(iso) {
  if (!iso) return { t: "z" };
  const [year, month, day] = iso.split("-").map(Number);
  return {
    t: "d",
    v: new Date(year, month - 1, day),
    z: "DD-MMM-YYYY",
  };
}

function textCell(value) {
  if (value == null || value === "") return { t: "z" };
  return { t: "s", v: String(value) };
}

function cellFor(header, value) {
  if (DATE_HEADERS.has(header)) return dateCell(value);
  return textCell(value);
}

function groupRanges(columns) {
  const ranges = [];
  let start = 0;
  while (start < columns.length) {
    const group = columns[start].group;
    let end = start;
    while (end + 1 < columns.length && columns[end + 1].group === group) end += 1;
    ranges.push({ group, start, end });
    start = end + 1;
  }
  return ranges;
}

const exampleComplete = {
  "Case Officer": "Example Officer",
  "Client Name": "Example Student (complete)",
  "Client ID": "STU-1001",
  "Date Registered": "2026-05-01",
  "Email Address": "student@example.com",
  "Phone Number": "67500000000",
  "Country of Passport": "PNG",
  "Offshore/Onshore": "Offshore",
  "Sent Intro Email": "2026-05-01",
  "Completed Initial Documents": "2026-05-08",
  "Started Course Discussions": "2026-05-10",
  Course: "Diploma of Nursing",
  School: "Example College",
  Intake: "2026-08-03",
  "M1 First Consult — Due": "2026-05-08",
  "M1 First Consult — Paid": "2026-05-06",
  "M2 Tuition / School Deposit — Due": "2026-05-22",
  "M2 Tuition / School Deposit — Paid": "2026-05-20",
  "M3 Visa Lodgement Fee — Due": "2026-06-05",
  "M3 Visa Lodgement Fee — Paid": "2026-06-04",
  "M4 OSHC — Due": "2026-06-12",
  "M4 OSHC — Paid": "2026-06-10",
  "M5 Second Consult — Due": "2026-06-19",
  "M5 Second Consult — Paid": "2026-06-18",
  Remarks: "Delete this example row before sending. Dates only in date columns.",
};

const exampleInProgress = {
  "Case Officer": "Example Officer",
  "Client Name": "Example Student (in progress)",
  "Client ID": "STU-1002",
  "Date Registered": "2026-06-15",
  "Email Address": "inprogress@example.com",
  "Phone Number": "67500000001",
  "Country of Passport": "PNG",
  "Offshore/Onshore": "Offshore",
  "Sent Intro Email": "2026-06-15",
  "Completed Initial Documents": "2026-06-20",
  "Started Course Discussions": "2026-06-22",
  Course: "Diploma of Community Services",
  School: "Example College",
  Intake: "2026-11-02",
  "M1 First Consult — Due": "2026-06-22",
  "M1 First Consult — Paid": "2026-06-21",
  "M2 Tuition / School Deposit — Due": "2026-07-06",
  Remarks: "Leave Paid blank until the fee is actually paid. Do not write N/A or *.",
};

function trackerSheet() {
  const ws = {};
  const groups = groupRanges(COLUMNS);
  const merges = groups
    .filter((range) => range.end > range.start)
    .map((range) => ({
      s: { r: 0, c: range.start },
      e: { r: 0, c: range.end },
    }));

  for (const range of groups) {
    const addr = XLSX.utils.encode_cell({ r: 0, c: range.start });
    ws[addr] = { t: "s", v: range.group };
  }

  COLUMNS.forEach((col, index) => {
    ws[XLSX.utils.encode_cell({ r: 1, c: index })] = { t: "s", v: col.header };
  });

  const examples = [exampleComplete, exampleInProgress];
  examples.forEach((row, rowOffset) => {
    COLUMNS.forEach((col, colIndex) => {
      ws[XLSX.utils.encode_cell({ r: 2 + rowOffset, c: colIndex })] = cellFor(
        col.header,
        row[col.header],
      );
    });
  });

  const lastDataRow = 201;
  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: lastDataRow, c: COLUMNS.length - 1 },
  });
  ws["!merges"] = merges;
  ws["!freeze"] = { xSplit: 3, ySplit: 2 };
  ws["!cols"] = COLUMNS.map((col) => ({
    wch: Math.min(36, Math.max(16, col.header.length + 2)),
  }));
  ws["!autofilter"] = {
    ref: XLSX.utils.encode_range({
      s: { r: 1, c: 0 },
      e: { r: lastDataRow, c: COLUMNS.length - 1 },
    }),
  };

  return ws;
}

function instructionsSheet() {
  const lines = [
    ["Enrolments Team Tracker — monthly template"],
    [""],
    ["How to use"],
    ["1. Keep one row per student. Send the full snapshot every month (not only new students)."],
    ["2. Required for Mission Control: Client Name, Client ID, Date Registered."],
    ["3. Client ID must be filled on every row. Duplicate IDs should not appear."],
    ["4. Date Registered is the date the student registered / entered enrolment — used for Monthly Enrolments."],
    [""],
    ["Fee milestone dates (these drive the Enrolment & Finance dashboard)"],
    ["Each fee has two columns: Due (target) and Paid (actual)."],
    ["M1 First Consult | M2 Tuition / School Deposit | M3 Visa Lodgement Fee | M4 OSHC | M5 Second Consult"],
    ["Due = when the fee should be paid. Paid = the date it was actually paid. Leave Paid blank if not paid yet."],
    ["AT RISK on the dashboard = Due date has passed by more than 7 days and Paid is still blank."],
    [""],
    ["Date columns"],
    ["Use real Excel dates (example: 15-Jun-2026). Do not type *, N/A, PENDING, or notes in date/fee columns."],
    ["Put all comments in Remarks."],
    ["Delete the two example rows before sending the first live file."],
    [""],
    ["Sheets"],
    ["Enrolments Tracker — fill this one."],
    ["Case officers — optional lookup list of schools / officers (not uploaded)."],
  ];

  const ws = XLSX.utils.aoa_to_sheet(lines);
  ws["!cols"] = [{ wch: 120 }];
  return ws;
}

function officersSheet() {
  const ws = XLSX.utils.aoa_to_sheet([
    ["School", "Case Officer", "Email Address", "Whatsapp Number"],
    ["", "", "", ""],
  ]);
  ws["!cols"] = [{ wch: 22 }, { wch: 22 }, { wch: 32 }, { wch: 20 }];
  return ws;
}

const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, instructionsSheet(), "Instructions");
XLSX.utils.book_append_sheet(wb, trackerSheet(), "Enrolments Tracker");
XLSX.utils.book_append_sheet(wb, officersSheet(), "Case officers");

const here = dirname(fileURLToPath(import.meta.url));
const repoFile = join(here, "..", "public", "templates", "Enrolments Team Tracker.xlsx");
const downloadsFile = join(
  process.env.USERPROFILE ?? "",
  "Downloads",
  "Enrolments Team Tracker_TEMPLATE.xlsx",
);

mkdirSync(dirname(repoFile), { recursive: true });
writeFileSync(repoFile, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
copyFileSync(repoFile, downloadsFile);
console.log(`Wrote ${repoFile}`);
console.log(`Wrote ${downloadsFile}`);
