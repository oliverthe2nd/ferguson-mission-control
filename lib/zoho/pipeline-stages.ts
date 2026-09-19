import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { zohoPipelineStages } from "@/lib/schema";
import type { StudyCentrePipelineStage } from "@/lib/framework/types";

export async function getLatestStudyCentreStages(): Promise<
  StudyCentrePipelineStage[] | null
> {
  if (!db) return null;

  try {
    const [row] = await db
      .select()
      .from(zohoPipelineStages)
      .where(eq(zohoPipelineStages.pipeline, "Study Centre"))
      .orderBy(desc(zohoPipelineStages.synced_at))
      .limit(1);

    if (!row?.stages || !Array.isArray(row.stages)) return null;
    return row.stages as StudyCentrePipelineStage[];
  } catch {
    return null;
  }
}
