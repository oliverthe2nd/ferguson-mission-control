import { revalidateTag, unstable_cache } from "next/cache";
import type { ReportType } from "./constants";
import {
  getLastUpdatedByPillar,
  getLatestSnapshots,
  getLatestUploadSnapshots,
} from "./queries";

const CACHE_SECONDS = 120;

export function getCachedLatestUploadSnapshots(reportType: ReportType) {
  return unstable_cache(
    async () => getLatestUploadSnapshots(reportType),
    [`upload-snapshots-${reportType}`],
    {
      revalidate: CACHE_SECONDS,
      tags: [`pillar-${reportType}`, "dashboard-data"],
    },
  )();
}

export function getCachedLatestSnapshots(reportType: ReportType, limit: number) {
  return unstable_cache(
    async () => getLatestSnapshots(reportType, limit),
    [`latest-snapshots-${reportType}-${limit}`],
    {
      revalidate: CACHE_SECONDS,
      tags: [`pillar-${reportType}`, "dashboard-data"],
    },
  )();
}

export async function getCachedLastUpdatedByPillar(): Promise<Map<string, Date>> {
  const record = await unstable_cache(
    async () => {
      const map = await getLastUpdatedByPillar();
      return Object.fromEntries(
        [...map.entries()].map(([key, value]) => [key, value.toISOString()]),
      );
    },
    ["last-updated-by-pillar"],
    {
      revalidate: CACHE_SECONDS,
      tags: ["dashboard-data"],
    },
  )();

  return new Map(
    Object.entries(record).map(([key, value]) => [key, new Date(value)]),
  );
}

export function revalidateDashboardData(reportType?: ReportType) {
  revalidateTag("dashboard-data", "max");
  if (reportType) {
    revalidateTag(`pillar-${reportType}`, "max");
  }
}
