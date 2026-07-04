import { NextResponse } from "next/server";
import { getAuthUserId } from "@/lib/auth";
import { REPORT_TYPES, type ReportType } from "@/lib/constants";
import { getAllSnapshots } from "@/lib/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> },
) {
  const userId = await getAuthUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { type } = await params;

  if (!REPORT_TYPES.includes(type as ReportType)) {
    return NextResponse.json({ error: "Invalid report type" }, { status: 400 });
  }

  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ snapshots: [] });
  }

  try {
    const snapshots = await getAllSnapshots(type as ReportType);
    return NextResponse.json({ snapshots });
  } catch (error) {
    console.error("Report fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch report" }, { status: 500 });
  }
}
