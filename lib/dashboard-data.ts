import { buildAlertTray, getArStatus, getSalesRag, getVisaAlerts, isStudentAtRisk } from "./alerts";
import type { ReportType } from "./constants";
import { KPI, PILLAR_ROUTES, REPORT_TYPE_LABELS } from "./constants";
import { normalizeEnrolmentRows } from "./enrolment-dates";
import { formatAud, formatDateTime, formatLastUpload, formatPct } from "./format";
import {
  flattenSnapshotRows,
  getLastUpdatedByPillar,
  getLatestSnapshots,
  getLatestUploadSnapshots,
} from "./queries";
import { getAllSampleData, getSampleRows } from "./sample-rows";
import type { AccountsReceivableRow } from "./validators/accounts-receivable";
import type { EnrolmentMilestoneRow } from "./validators/enrolment-milestones";
import type { JobPlacementRow } from "./validators/job-placement";
import type { SalesPipelineRow } from "./validators/sales-pipeline";
import type { StudyCentresRow } from "./validators/study-centres";
import type { VisaLodgementRow } from "./validators/visa-lodgement";

type OverviewInput = {
  sales: SalesPipelineRow[];
  enrolment: EnrolmentMilestoneRow[];
  visa: VisaLodgementRow[];
  accounts: AccountsReceivableRow[];
  placement: JobPlacementRow[];
  centres: StudyCentresRow[];
  salesSparkline?: number[];
  visaSparkline?: number[];
  placementSparkline?: number[];
  centresSparkline?: number[];
  lastUpdated?: Map<string, Date>;
};

function buildOverviewCards(input: OverviewInput) {
  const {
    sales,
    enrolment,
    visa,
    accounts,
    placement,
    centres,
    salesSparkline,
    visaSparkline,
    placementSparkline,
    centresSparkline,
    lastUpdated = new Map(),
  } = input;

  const latestSales = sales[0];
  const visaAlert = getVisaAlerts(visa);
  const atRiskCount = enrolment.filter((row) => isStudentAtRisk(row)).length;
  const totalAr = accounts.reduce((sum, row) => sum + row.amount_aud, 0);
  const urgentAr = accounts.filter((row) => row.days_outstanding >= KPI.AR_AMBER_DAYS).length;
  const latestPlacement = placement[0];
  const latestCentres = centres.reduce((sum, row) => sum + row.active_year1_students, 0);

  const cards = [
    {
      title: REPORT_TYPE_LABELS.sales_pipeline,
      metric: latestSales ? formatPct(latestSales.lead_to_reg_pct) : "—",
      metricLabel: "Lead-to-registration conversion",
      href: PILLAR_ROUTES.sales_pipeline,
      status: latestSales ? getSalesRag(latestSales) : ("green" as const),
      sparklineData: (salesSparkline ?? sales.map((row) => row.lead_to_reg_pct)).map(
        (value) => ({ value }),
      ),
      lastUpdated: lastUpdated.get("sales_pipeline")
        ? formatDateTime(lastUpdated.get("sales_pipeline")!)
        : undefined,
    },
    {
      title: REPORT_TYPE_LABELS.enrolment_milestones,
      metric: String(atRiskCount),
      metricLabel: "Students AT RISK",
      href: PILLAR_ROUTES.enrolment_milestones,
      status: atRiskCount > 0 ? ("red" as const) : ("green" as const),
      sparklineData: [{ value: atRiskCount }],
      lastUpdated: lastUpdated.get("enrolment_milestones")
        ? formatDateTime(lastUpdated.get("enrolment_milestones")!)
        : undefined,
    },
    {
      title: REPORT_TYPE_LABELS.visa_lodgement,
      metric: visa.length > 0 ? String(visa.reduce((s, r) => s + r.lodged_count, 0)) : "—",
      metricLabel: "Visas lodged (latest period)",
      href: PILLAR_ROUTES.visa_lodgement,
      status: visaAlert.hasRefusals
        ? ("red" as const)
        : visaAlert.turnaroundAmber
          ? ("amber" as const)
          : ("green" as const),
      sparklineData: (visaSparkline ?? [visa.reduce((s, r) => s + r.lodged_count, 0)]).map(
        (value) => ({ value }),
      ),
      lastUpdated: lastUpdated.get("visa_lodgement")
        ? formatDateTime(lastUpdated.get("visa_lodgement")!)
        : undefined,
    },
    {
      title: REPORT_TYPE_LABELS.accounts_receivable,
      metric: accounts.length > 0 ? formatAud(totalAr) : "—",
      metricLabel: `${urgentAr} requiring follow-up`,
      href: PILLAR_ROUTES.accounts_receivable,
      status: urgentAr > 0 ? ("amber" as const) : ("green" as const),
      sparklineData: [{ value: totalAr }],
      lastUpdated: lastUpdated.get("accounts_receivable")
        ? formatDateTime(lastUpdated.get("accounts_receivable")!)
        : undefined,
    },
    {
      title: REPORT_TYPE_LABELS.job_placement,
      metric: latestPlacement ? String(latestPlacement.successfully_placed_jobs) : "—",
      metricLabel: "Jobs placed (latest period)",
      href: PILLAR_ROUTES.job_placement,
      status: "green" as const,
      sparklineData: (placementSparkline ?? placement.map((row) => row.successfully_placed_jobs)).map(
        (value) => ({ value }),
      ),
      lastUpdated: lastUpdated.get("job_placement")
        ? formatDateTime(lastUpdated.get("job_placement")!)
        : undefined,
    },
    {
      title: REPORT_TYPE_LABELS.study_centres,
      metric: centres.length > 0 ? String(latestCentres) : "—",
      metricLabel: "Active Year 1 students (all branches)",
      href: PILLAR_ROUTES.study_centres,
      status: "green" as const,
      sparklineData: (centresSparkline ?? [latestCentres]).map((value) => ({ value })),
      lastUpdated: lastUpdated.get("study_centres")
        ? formatDateTime(lastUpdated.get("study_centres")!)
        : undefined,
    },
  ];

  const alerts = buildAlertTray({ sales, enrolment, visa, accounts });

  return { cards, alerts };
}

function buildOverviewFromSample() {
  const sample = getAllSampleData();
  return buildOverviewCards({
    ...sample,
    enrolment: normalizeEnrolmentRows(sample.enrolment),
    salesSparkline: sample.sales.map((row) => row.lead_to_reg_pct),
    placementSparkline: sample.placement.map((row) => row.successfully_placed_jobs),
    centresSparkline: [sample.centres.reduce((sum, row) => sum + row.active_year1_students, 0)],
  });
}

export async function getDashboardOverview() {
  if (!process.env.DATABASE_URL) {
    const { cards, alerts } = buildOverviewFromSample();
    return { cards, alerts, hasDatabase: false, usingSampleData: true };
  }

  try {
    const [
      salesSnapshots,
      enrolmentUploadResult,
      visaSnapshots,
      accountsSnapshots,
      placementSnapshots,
      centresSnapshots,
      lastUpdated,
    ] = await Promise.all([
      getLatestSnapshots("sales_pipeline", 8),
      getLatestUploadSnapshots("enrolment_milestones"),
      getLatestSnapshots("visa_lodgement", 8),
      getLatestSnapshots("accounts_receivable", 1),
      getLatestSnapshots("job_placement", 8),
      getLatestSnapshots("study_centres", 8),
      getLastUpdatedByPillar(),
    ]);

    const sales = flattenSnapshotRows<SalesPipelineRow>(salesSnapshots);
    const { snapshots: enrolmentSnapshots } = enrolmentUploadResult;
    const enrolment = normalizeEnrolmentRows(
      flattenSnapshotRows<EnrolmentMilestoneRow>(enrolmentSnapshots),
    );
    const visa = flattenSnapshotRows<VisaLodgementRow>(visaSnapshots);
    const accounts = flattenSnapshotRows<AccountsReceivableRow>(accountsSnapshots);
    const placement = flattenSnapshotRows<JobPlacementRow>(placementSnapshots);
    const centres = flattenSnapshotRows<StudyCentresRow>(centresSnapshots);

    if (
      sales.length === 0 &&
      enrolment.length === 0 &&
      visa.length === 0 &&
      accounts.length === 0 &&
      placement.length === 0 &&
      centres.length === 0
    ) {
      const { cards, alerts } = buildOverviewFromSample();
      return { cards, alerts, hasDatabase: true, usingSampleData: true };
    }

    const { cards, alerts } = buildOverviewCards({
      sales,
      enrolment,
      visa,
      accounts,
      placement,
      centres,
      salesSparkline: salesSnapshots
        .slice()
        .reverse()
        .map((s) => (s.data as SalesPipelineRow).lead_to_reg_pct ?? 0),
      visaSparkline: visaSnapshots
        .slice()
        .reverse()
        .map((s) =>
          Array.isArray(s.data)
            ? (s.data as VisaLodgementRow[]).reduce((sum, r) => sum + r.lodged_count, 0)
            : ((s.data as VisaLodgementRow).lodged_count ?? 0),
        ),
      placementSparkline: placementSnapshots
        .slice()
        .reverse()
        .map((s) => (s.data as JobPlacementRow).successfully_placed_jobs ?? 0),
      centresSparkline: centresSnapshots
        .slice()
        .reverse()
        .map((s) =>
          Array.isArray(s.data)
            ? (s.data as StudyCentresRow[]).reduce((sum, r) => sum + r.active_year1_students, 0)
            : ((s.data as StudyCentresRow).active_year1_students ?? 0),
        ),
      lastUpdated,
    });

    return { cards, alerts, hasDatabase: true, usingSampleData: false };
  } catch {
    const { cards, alerts } = buildOverviewFromSample();
    return { cards, alerts, hasDatabase: false, usingSampleData: true };
  }
}

export async function getPillarData<T>(reportType: ReportType) {
  const sampleRows = getSampleRows<T>(reportType);

  if (!process.env.DATABASE_URL) {
    return {
      rows:
        reportType === "enrolment_milestones"
          ? (normalizeEnrolmentRows(sampleRows as EnrolmentMilestoneRow[]) as T[])
          : sampleRows,
      hasDatabase: false,
      usingSampleData: sampleRows.length > 0,
      lastUploadLabel: null,
    };
  }

  try {
    const { snapshots, upload } = await getLatestUploadSnapshots(reportType);
    let rows = flattenSnapshotRows<T>(snapshots);
    if (reportType === "enrolment_milestones" && rows.length > 0) {
      rows = normalizeEnrolmentRows(rows as EnrolmentMilestoneRow[]) as T[];
    }
    const lastUploadLabel = formatLastUpload(upload);
    if (rows.length > 0) {
      return { rows, hasDatabase: true, usingSampleData: false, lastUploadLabel };
    }
    return {
      rows:
        reportType === "enrolment_milestones"
          ? (normalizeEnrolmentRows(sampleRows as EnrolmentMilestoneRow[]) as T[])
          : sampleRows,
      hasDatabase: true,
      usingSampleData: sampleRows.length > 0,
      lastUploadLabel: null,
    };
  } catch {
    return {
      rows:
        reportType === "enrolment_milestones"
          ? (normalizeEnrolmentRows(sampleRows as EnrolmentMilestoneRow[]) as T[])
          : sampleRows,
      hasDatabase: false,
      usingSampleData: sampleRows.length > 0,
      lastUploadLabel: null,
    };
  }
}

export { getArStatus, isStudentAtRisk };
