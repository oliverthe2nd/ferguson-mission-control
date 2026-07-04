import { getMilestoneActual, getMilestoneTarget } from "./enrolment-dates";
import { KPI } from "./constants";
import type { AccountsReceivableRow } from "./validators/accounts-receivable";
import type { EnrolmentMilestoneRow } from "./validators/enrolment-milestones";
import type { SalesPipelineRow } from "./validators/sales-pipeline";
import type { VisaLodgementRow } from "./validators/visa-lodgement";

export type RagStatus = "green" | "amber" | "red";

export interface AlertItem {
  id: string;
  pillar: string;
  message: string;
  severity: "amber" | "red";
  href?: string;
}

const MILESTONES = ["m1", "m2", "m3", "m4", "m5"] as const;

export function getSalesRag(row: SalesPipelineRow): RagStatus {
  if (row.lead_to_reg_pct < KPI.LEAD_TO_REG_TARGET_PCT) return "red";
  if (
    row.avg_days_reg_to_offer > KPI.MAX_DAYS_REG_TO_OFFER ||
    row.avg_days_offer_to_first_payment > KPI.MAX_DAYS_OFFER_TO_PAYMENT
  ) {
    return "amber";
  }
  return "green";
}

export function isStudentAtRisk(row: EnrolmentMilestoneRow, now = new Date()): boolean {
  for (const key of MILESTONES) {
    const target = getMilestoneTarget(row, key);
    const actual = getMilestoneActual(row, key);
    if (actual === null && target) {
      const daysOverdue =
        (now.getTime() - target.getTime()) / (1000 * 60 * 60 * 24);
      if (daysOverdue > KPI.MILESTONE_STALL_DAYS) return true;
    }
  }
  return false;
}

export function getArStatus(days: number): {
  label: string;
  severity: RagStatus;
} {
  if (days >= KPI.AR_LEGAL_DAYS) {
    return { label: "Legal Demand", severity: "red" };
  }
  if (days >= KPI.AR_RED_DAYS) {
    return { label: "Urgent", severity: "red" };
  }
  if (days >= KPI.AR_AMBER_DAYS) {
    return { label: "Follow Up", severity: "amber" };
  }
  return { label: "Current", severity: "green" };
}

export function getVisaAlerts(rows: VisaLodgementRow[]) {
  const refused = rows.reduce((sum, row) => sum + row.refused_count, 0);
  const avgTurnaround =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + row.avg_days_file_to_lodgement, 0) /
        rows.length
      : 0;

  return {
    hasRefusals: refused > 0,
    turnaroundAmber: avgTurnaround > KPI.MAX_DAYS_VISA_LODGE_TURNAROUND,
    avgTurnaround,
  };
}

export function buildAlertTray(input: {
  sales: SalesPipelineRow[];
  enrolment: EnrolmentMilestoneRow[];
  visa: VisaLodgementRow[];
  accounts: AccountsReceivableRow[];
}): AlertItem[] {
  const alerts: AlertItem[] = [];

  const latestSales = input.sales[0];
  if (latestSales && latestSales.lead_to_reg_pct < KPI.LEAD_TO_REG_TARGET_PCT) {
    alerts.push({
      id: "sales-lead-reg",
      pillar: "Sales & Marketing",
      message: `Lead-to-registration at ${latestSales.lead_to_reg_pct}% (below ${KPI.LEAD_TO_REG_TARGET_PCT}% target)`,
      severity: "red",
      href: "/dashboard/sales",
    });
  }

  const atRiskStudents = input.enrolment.filter((row) => isStudentAtRisk(row));
  if (atRiskStudents.length > 0) {
    alerts.push({
      id: "enrolment-at-risk",
      pillar: "Enrolment & Finance",
      message: `${atRiskStudents.length} student(s) AT RISK — milestone stalled > ${KPI.MILESTONE_STALL_DAYS} days`,
      severity: "red",
      href: "/dashboard/enrolment",
    });
  }

  const visaAlerts = getVisaAlerts(input.visa);
  if (visaAlerts.hasRefusals) {
    alerts.push({
      id: "visa-refused",
      pillar: "Visa Team",
      message: "Visa refusals detected — requires immediate management review",
      severity: "red",
      href: "/dashboard/visa",
    });
  }
  if (visaAlerts.turnaroundAmber) {
    alerts.push({
      id: "visa-turnaround",
      pillar: "Visa Team",
      message: `Average lodge turnaround ${visaAlerts.avgTurnaround.toFixed(1)} days (>${KPI.MAX_DAYS_VISA_LODGE_TURNAROUND} day target)`,
      severity: "amber",
      href: "/dashboard/visa",
    });
  }

  const urgentAr = input.accounts.filter(
    (row) => row.days_outstanding >= KPI.AR_AMBER_DAYS,
  );
  if (urgentAr.length > 0) {
    alerts.push({
      id: "accounts-ar",
      pillar: "Accounts",
      message: `${urgentAr.length} receivable(s) require follow-up or escalation`,
      severity: urgentAr.some((row) => row.days_outstanding >= KPI.AR_RED_DAYS)
        ? "red"
        : "amber",
      href: "/dashboard/accounts",
    });
  }

  return alerts;
}
