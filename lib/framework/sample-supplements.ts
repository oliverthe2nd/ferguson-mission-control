import type {
  DrillDownRecord,
  StudyCentreAvgDays,
  StudyCentrePipelineStage,
  VisaPipelineStatus,
} from "./types";
import { sampleSales } from "@/lib/sample-data";

const d = (iso: string) => new Date(iso);

export const sampleVisaPipelineStatus: VisaPipelineStatus = {
  lodged_this_week: 12,
  total_refused: 3,
  total_processing: 28,
  pending_s56: 4,
  pending_biometrics: 7,
  pending_medicals: 5,
  pending_other: 2,
};

export const sampleStudyCentrePipeline: StudyCentrePipelineStage[] = [
  { stage: "Registered / Payment Made", count: 45 },
  { stage: "Payment Confirmed (Kim)", count: 38 },
  { stage: "Enrolment In Progress", count: 32 },
  { stage: "Offer Letter / Installment Pending", count: 24 },
  { stage: "Installment Paid (Kim)", count: 18 },
  { stage: "Fee Paid / Laptop Cleared", count: 14 },
  { stage: "Cleared to Start Studies", count: 11 },
];

export const sampleStudyCentreAvgDays: StudyCentreAvgDays[] = sampleSales.map((row) => ({
  period: row.period_start,
  avg_days_reg_to_offer: row.avg_days_reg_to_offer,
  avg_days_offer_to_first_payment: row.avg_days_offer_to_first_payment,
}));

export function sampleSalesLeadDrilldown(periodLabel: string, source: string): DrillDownRecord[] {
  return [
    {
      id: "1",
      label: "Sample Lead A",
      sublabel: source,
      detail: periodLabel,
      meta: { phone: "+679 000 0001", topic: "Student visa inquiry" },
    },
    {
      id: "2",
      label: "Sample Lead B",
      sublabel: source,
      detail: periodLabel,
      meta: { phone: "+679 000 0002", topic: "Course enquiry" },
    },
    {
      id: "3",
      label: "Sample Lead C",
      sublabel: source,
      detail: periodLabel,
      meta: { client_id: "CLI-1042", topic: "Walk-in" },
    },
  ];
}

export function sampleEnrolmentMonthDrilldown(monthLabel: string): DrillDownRecord[] {
  return [
    {
      id: "370172",
      label: "Jenna Babao",
      sublabel: "Student ID 370172",
      detail: monthLabel,
      meta: { registered: "2026-03-01", status: "On track" },
    },
    {
      id: "424466",
      label: "Racheal Meto",
      sublabel: "Student ID 424466",
      detail: monthLabel,
      meta: { registered: "2026-06-19", status: "AT RISK" },
    },
  ];
}

export function sampleVisaLodgementDrilldown(periodLabel: string): DrillDownRecord[] {
  return [
    {
      id: "V-500-001",
      label: "Subclass 500",
      sublabel: "Lodged",
      detail: periodLabel,
      meta: { turnaround_days: 5, officer: "Maria" },
    },
    {
      id: "V-482-002",
      label: "Subclass 482",
      sublabel: "Lodged",
      detail: periodLabel,
      meta: { turnaround_days: 9, officer: "Maria" },
    },
  ];
}

export function sampleVisaTurnaroundDrilldown(bucket: string): DrillDownRecord[] {
  return [
    {
      id: "FILE-101",
      label: "Student File #101",
      sublabel: bucket,
      detail: "Visa stage → lodged",
      meta: { days: bucket.includes("7") ? 5 : 10 },
    },
    {
      id: "FILE-102",
      label: "Student File #102",
      sublabel: bucket,
      detail: "Visa stage → lodged",
      meta: { days: bucket.includes("7") ? 6 : 12 },
    },
  ];
}

export function sampleStudyCentreWalkInDrilldown(branch: string, period: string): DrillDownRecord[] {
  return [
    {
      id: "W-1",
      label: "Walk-in visitor",
      sublabel: branch,
      detail: period,
      meta: { inquiry: "Diploma pathway", email: "visitor@example.com" },
    },
    {
      id: "W-2",
      label: "Returning client",
      sublabel: branch,
      detail: period,
      meta: { client_id: "CLI-882", phone: "+679 000 0099" },
    },
  ];
}
