import { desc, eq } from "drizzle-orm";
import type { ReportType } from "./constants";
import { requireDb } from "./db";
import { reportSnapshots, uploads } from "./schema";

export async function getLatestSnapshots(reportType: ReportType, limit = 8) {
  const database = requireDb();
  return database
    .select()
    .from(reportSnapshots)
    .where(eq(reportSnapshots.report_type, reportType))
    .orderBy(desc(reportSnapshots.period_date))
    .limit(limit);
}

export async function getAllSnapshots(reportType: ReportType) {
  const database = requireDb();
  return database
    .select()
    .from(reportSnapshots)
    .where(eq(reportSnapshots.report_type, reportType))
    .orderBy(desc(reportSnapshots.period_date));
}

export async function getUploadHistory(limit = 50) {
  const database = requireDb();
  return database
    .select()
    .from(uploads)
    .orderBy(desc(uploads.created_at))
    .limit(limit);
}

export async function getLastUpdatedByPillar() {
  const database = requireDb();
  const all = await database
    .select()
    .from(reportSnapshots)
    .orderBy(desc(reportSnapshots.created_at));

  const map = new Map<string, Date>();
  for (const row of all) {
    if (!map.has(row.report_type)) {
      map.set(row.report_type, row.created_at);
    }
  }
  return map;
}

export function flattenSnapshotRows<T>(snapshots: { data: unknown }[]): T[] {
  return snapshots.flatMap((snapshot) => {
    if (Array.isArray(snapshot.data)) {
      return snapshot.data as T[];
    }
    return [snapshot.data as T];
  });
}
