import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { isZohoConfigured } from "@/lib/zoho/config";
import { syncSalesPipelineFromZoho } from "@/lib/zoho/sync-sales-pipeline";

export const maxDuration = 120;

function isAuthorizedCron(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isZohoConfigured()) {
    return NextResponse.json(
      { error: "Zoho CRM is not configured" },
      { status: 503 },
    );
  }

  const cron = isAuthorizedCron(request);
  let uploadedBy = "zoho-cron";

  if (!cron) {
    const admin = await requireAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }
    uploadedBy = admin.email ?? admin.id;
  }

  try {
    const body = cron ? {} : await request.json().catch(() => ({}));
    const weekCount =
      typeof body.weekCount === "number" && body.weekCount > 0
        ? Math.min(body.weekCount, 26)
        : undefined;

    const result = await syncSalesPipelineFromZoho({
      weekCount,
      uploadedBy,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Zoho sales sync error:", error);
    const message =
      error instanceof Error ? error.message : "Zoho sync failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
