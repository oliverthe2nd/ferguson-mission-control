import type { ReportType } from "@/lib/constants";
import { getPillarData } from "@/lib/dashboard-data";
import { getSampleRows } from "@/lib/sample-rows";
import { normalizeEnrolmentRows } from "@/lib/enrolment-dates";
import { excludeFuturePeriodRows } from "@/lib/format";
import type { EnrolmentMilestoneRow } from "@/lib/validators/enrolment-milestones";
import type { VisaLodgementRow } from "@/lib/validators/visa-lodgement";
import type {
  StudyCentreAvgDays,
  StudyCentrePipelineStage,
  VisaPipelineStatus,
} from "./types";
import {
  sampleStudyCentreAvgDays,
  sampleStudyCentrePipeline,
  sampleVisaPipelineStatus,
} from "./sample-supplements";

export type ResolvedPillarData<T> = {
  rows: T[];
  hasDatabase: boolean;
  usingSampleData: boolean;
  lastUploadLabel: string | null;
  /** Live data existed but lacked fields required by the new framework — sample shown instead. */
  forcedSampleFallback: boolean;
};

function normalizeSampleRows<T>(reportType: ReportType, rows: T[]): T[] {
  if (reportType === "enrolment_milestones") {
    return normalizeEnrolmentRows(rows as EnrolmentMilestoneRow[]) as T[];
  }
  if (reportType === "visa_lodgement") {
    return excludeFuturePeriodRows(rows as VisaLodgementRow[]) as T[];
  }
  return rows;
}

function liveRowsMeetFramework(reportType: ReportType, rows: unknown[]): boolean {
  if (rows.length === 0) return false;

  switch (reportType) {
    case "sales_pipeline":
      return true;
    case "enrolment_milestones":
      return rows.some(
        (r) =>
          (r as EnrolmentMilestoneRow).registration_date != null &&
          Boolean((r as EnrolmentMilestoneRow).student_id),
      );
    case "visa_lodgement":
      return rows.some((r) => {
        const row = r as VisaLodgementRow & {
          pending_s56?: number;
          pending_biometrics?: number;
          pending_medicals?: number;
        };
        return (
          row.lodged_count > 0 &&
          (row.pending_s56 != null ||
            row.pending_biometrics != null ||
            row.pending_medicals != null)
        );
      });
    case "study_centres":
      return rows.some(
        (r) =>
          (r as { walkin_traffic?: number }).walkin_traffic != null &&
          Number((r as { walkin_traffic?: number }).walkin_traffic) > 0,
      );
    case "job_placement":
    case "accounts_receivable":
      return true;
    default:
      return true;
  }
}

export async function getResolvedPillarData<T>(
  reportType: ReportType,
): Promise<ResolvedPillarData<T>> {
  const base = await getPillarData<T>(reportType);

  if (base.usingSampleData || base.rows.length === 0) {
    return { ...base, forcedSampleFallback: false };
  }

  if (!liveRowsMeetFramework(reportType, base.rows as unknown[])) {
    const sample = normalizeSampleRows<T>(reportType, getSampleRows<T>(reportType));
    return {
      rows: sample,
      hasDatabase: base.hasDatabase,
      usingSampleData: true,
      lastUploadLabel: null,
      forcedSampleFallback: true,
    };
  }

  return { ...base, forcedSampleFallback: false };
}

export function resolveVisaPipelineStatus(
  rows: VisaLodgementRow[],
  usingSampleData: boolean,
): { status: VisaPipelineStatus; isSample: boolean } {
  if (usingSampleData || !liveRowsMeetFramework("visa_lodgement", rows)) {
    return { status: sampleVisaPipelineStatus, isSample: true };
  }

  const latest = rows[0];
  const extended = latest as VisaLodgementRow & {
    pending_s56?: number;
    pending_biometrics?: number;
    pending_medicals?: number;
  };

  const lodgedThisWeek = rows
    .filter((r) => {
      const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      return new Date(r.period).getTime() >= weekAgo;
    })
    .reduce((s, r) => s + r.lodged_count, 0);

  return {
    status: {
      lodged_this_week: lodgedThisWeek,
      total_refused: rows.reduce((s, r) => s + r.refused_count, 0),
      total_processing: rows.reduce((s, r) => s + (r.processing_count ?? 0), 0),
      pending_s56: extended.pending_s56 ?? 0,
      pending_biometrics: extended.pending_biometrics ?? 0,
      pending_medicals: extended.pending_medicals ?? 0,
      pending_other: Math.max(
        0,
        rows.reduce((s, r) => s + (r.pending_actions_count ?? 0), 0) -
          (extended.pending_s56 ?? 0) -
          (extended.pending_biometrics ?? 0) -
          (extended.pending_medicals ?? 0),
      ),
    },
    isSample: false,
  };
}

export function resolveStudyCentrePipeline(
  usingSampleData: boolean,
): { stages: StudyCentrePipelineStage[]; isSample: boolean } {
  if (usingSampleData) {
    return { stages: sampleStudyCentrePipeline, isSample: true };
  }
  return { stages: sampleStudyCentrePipeline, isSample: true };
}

export function resolveStudyCentreAvgDays(
  usingSampleData: boolean,
): { rows: StudyCentreAvgDays[]; isSample: boolean } {
  if (usingSampleData) {
    return { rows: sampleStudyCentreAvgDays, isSample: true };
  }
  return { rows: sampleStudyCentreAvgDays, isSample: true };
}
