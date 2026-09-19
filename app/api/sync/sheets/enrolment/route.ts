import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import {
  isMicrosoftGraphConfigured,
  syncEnrolmentFromSharePoint,
} from "@/lib/sheets/sync-enrolment-sharepoint";

export const maxDuration = 60;

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (secret && request.headers.get("authorization") === `Bearer ${secret}`) {
    return true;
  }
  return request.headers.get("x-vercel-cron") === "1";
}

async function handle(request: Request) {
  if (!isMicrosoftGraphConfigured()) {
    return NextResponse.json(
      { error: "Microsoft Graph is not configured" },
      { status: 503 },
    );
  }

  const cron = isAuthorizedCron(request);
  let uploadedBy = "sharepoint-cron";

  if (!cron) {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    uploadedBy = admin.email ?? admin.id;
  }

  try {
    const result = await syncEnrolmentFromSharePoint({ uploadedBy });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Enrolment SharePoint sync error:", error);
    const message =
      error instanceof Error ? error.message : "Enrolment sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handle(request);
}

export async function GET(request: Request) {
  return handle(request);
}
