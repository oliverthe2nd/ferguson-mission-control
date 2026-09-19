import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAskMeAnythingAccess } from "@/lib/ama/access";
import { refreshTrackedReport } from "@/lib/ama/refresh-tracked";
import { requireDb } from "@/lib/db";
import { trackedReports } from "@/lib/schema";

type Params = { params: Promise<{ id: string }> };

export async function POST(_request: Request, { params }: Params) {
  const user = await requireAskMeAnythingAccess();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const database = requireDb();
    const [existing] = await database
      .select()
      .from(trackedReports)
      .where(eq(trackedReports.id, id))
      .limit(1);

    if (!existing || existing.owner_email !== user.email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const report = await refreshTrackedReport(id);
    return NextResponse.json({ report });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to refresh report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const user = await requireAskMeAnythingAccess();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    const database = requireDb();
    const [existing] = await database
      .select()
      .from(trackedReports)
      .where(eq(trackedReports.id, id))
      .limit(1);

    if (!existing || existing.owner_email !== user.email) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await database.delete(trackedReports).where(eq(trackedReports.id, id));
    return NextResponse.json({ success: true });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
