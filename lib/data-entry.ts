import type { EditableReportType } from "./constants";
import { normalizeEnrolmentRows } from "./enrolment-dates";
import { flattenSnapshotRows, getLatestUploadSnapshots } from "./queries";
import type { EnrolmentMilestoneRow } from "./validators/enrolment-milestones";

export async function getEditableReportRows(reportType: EditableReportType) {
  const { snapshots, upload } = await getLatestUploadSnapshots(reportType);
  let rows = flattenSnapshotRows<Record<string, unknown>>(snapshots);

  if (reportType === "enrolment_milestones" && rows.length > 0) {
    rows = normalizeEnrolmentRows(rows as EnrolmentMilestoneRow[]) as Record<
      string,
      unknown
    >[];
  }

  return { rows, upload };
}
