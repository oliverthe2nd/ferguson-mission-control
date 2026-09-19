import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { requireAskMeAnythingAccess } from "@/lib/ama/access";
import { requireDb } from "@/lib/db";
import { trackedReports } from "@/lib/schema";
import { refreshTrackedReport } from "@/lib/ama/refresh-tracked";

export async function GET() {
  const user = await requireAskMeAnythingAccess();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const database = requireDb();
    const reports = await database
      .select()
      .from(trackedReports)
      .where(eq(trackedReports.owner_email, user.email))
      .orderBy(desc(trackedReports.updated_at))
      .limit(50);

    return NextResponse.json({ reports });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to list reports";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const user = await requireAskMeAnythingAccess();
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = (await request.json()) as {
      title?: string;
      question?: string;
      schedule?: "manual" | "daily";
      tool_plan?: Record<string, unknown>;
    };

    if (!body.title?.trim() || !body.question?.trim()) {
      return NextResponse.json(
        { error: "title and question are required" },
        { status: 400 },
      );
    }

    const database = requireDb();
    const [row] = await database
      .insert(trackedReports)
      .values({
        owner_email: user.email,
        title: body.title.trim(),
        question: body.question.trim(),
        tool_plan: body.tool_plan ?? {},
        schedule: body.schedule ?? "daily",
      })
      .returning();

    const refreshed = await refreshTrackedReport(row.id);

    return NextResponse.json({ report: refreshed ?? row });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to save report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
