import {
  fetchAllDealsInRange,
  fetchAllLeadsInRange,
  fetchDealStageHistory,
} from "../lib/zoho/client";
import { isZohoConfigured } from "../lib/zoho/config";
import { formatZohoDateTime, zohoBetweenRange } from "../lib/zoho/weeks";

async function check<T>(
  label: string,
  fn: () => Promise<T>,
): Promise<{ ok: boolean; detail: string }> {
  try {
    const result = await fn();
    const detail =
      typeof result === "number"
        ? `${result} rows`
        : Array.isArray(result)
          ? `${result.length} rows`
          : "ok";
    return { ok: true, detail };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ok: false, detail: message };
  }
}

async function main() {
  if (!isZohoConfigured()) {
    throw new Error(
      "Missing ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN in .env.local",
    );
  }

  const { start, end } = zohoBetweenRange(2);
  const startIso = formatZohoDateTime(start);
  const endIso = formatZohoDateTime(end);

  console.log("Checking Zoho CRM permissions…\n");

  const leads = await check("Leads search/read", () =>
    fetchAllLeadsInRange(startIso, endIso),
  );
  console.log(`${leads.ok ? "✓" : "✗"} Leads search/read — ${leads.detail}`);

  const deals = await check("Deals search/read", () =>
    fetchAllDealsInRange(startIso, endIso),
  );
  console.log(`${deals.ok ? "✓" : "✗"} Deals search/read — ${deals.detail}`);

  let stageHistory = { ok: false, detail: "skipped (Deals check failed)" };
  if (deals.ok) {
    const sampleDeals = await fetchAllDealsInRange(startIso, endIso);
    const converted = sampleDeals.find((deal) => deal.Stage?.includes("Paid"));
    if (converted) {
      stageHistory = await check("Deal Stage_History read", () =>
        fetchDealStageHistory(converted.id),
      );
    } else {
      stageHistory = {
        ok: false,
        detail: "no converted deal in sample window to test",
      };
    }
  }
  console.log(
    `${stageHistory.ok ? "✓" : "✗"} Deal Stage_History read — ${stageHistory.detail}`,
  );

  const missing = [
    !leads.ok && "ZohoCRM.modules.leads.READ",
    !deals.ok && "ZohoCRM.modules.deals.READ",
    !stageHistory.ok && "ZohoCRM.modules.deals.READ (related records / Stage_History)",
  ].filter(Boolean);

  if (missing.length > 0) {
    console.log(
      "\nMissing OAuth scopes. Regenerate the refresh token at https://api-console.zoho.com.au with:",
    );
    console.log(missing.map((scope) => `  - ${scope}`).join("\n"));
    console.log(
      "\nSuggested scope string:\n  ZohoCRM.modules.leads.READ,ZohoCRM.modules.deals.READ",
    );
    process.exit(1);
  }

  console.log("\nAll required Zoho permissions are available.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
