import type { ReportType } from "./constants";
import type { AccountsReceivableRow } from "./validators/accounts-receivable";
import type { EnrolmentMilestoneRow } from "./validators/enrolment-milestones";
import type { JobPlacementRow } from "./validators/job-placement";
import type { SalesPipelineRow } from "./validators/sales-pipeline";
import type { StudyCentresRow } from "./validators/study-centres";
import type { VisaLodgementRow } from "./validators/visa-lodgement";
import {
  sampleAccounts,
  sampleCentres,
  sampleEnrolment,
  samplePlacement,
  sampleSales,
  sampleVisa,
} from "./sample-data";

const SAMPLE_BY_TYPE = {
  sales_pipeline: sampleSales,
  enrolment_milestones: sampleEnrolment,
  visa_lodgement: sampleVisa,
  accounts_receivable: sampleAccounts,
  job_placement: samplePlacement,
  study_centres: sampleCentres,
} as const satisfies Record<ReportType, unknown[]>;

export function getSampleRows<T>(reportType: ReportType): T[] {
  return (SAMPLE_BY_TYPE[reportType] ?? []) as T[];
}

export function getAllSampleData() {
  return {
    sales: sampleSales as SalesPipelineRow[],
    enrolment: sampleEnrolment as EnrolmentMilestoneRow[],
    visa: sampleVisa as VisaLodgementRow[],
    accounts: sampleAccounts as AccountsReceivableRow[],
    placement: samplePlacement as JobPlacementRow[],
    centres: sampleCentres as StudyCentresRow[],
  };
}
