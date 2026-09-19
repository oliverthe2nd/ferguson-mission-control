import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { refreshDueTrackedReports } from "@/lib/ama/refresh-tracked";

export const maxDuration = 60;

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) {
    return true;
  }
  return request.headers.get("x-vercel-cron") === "1";
}

async function handle(request: Request) {
  const cron = isAuthorizedCron(request);
  if (!cron) {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }
  }

  try {
    const result = await refreshDueTrackedReports();
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Tracked report refresh failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
