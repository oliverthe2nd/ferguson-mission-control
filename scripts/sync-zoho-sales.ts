import { syncSalesPipelineFromZoho } from "../lib/zoho/sync-sales-pipeline";
import { isZohoConfigured } from "../lib/zoho/config";

async function main() {
  if (!isZohoConfigured()) {
    throw new Error(
      "Missing ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN",
    );
  }

  const result = await syncSalesPipelineFromZoho({
    uploadedBy: "zoho-sync-script",
  });

  console.log(
    `Zoho sales sync complete: ${result.rowCount} rows, ${result.leadsFetched} leads, ${result.dealsFetched} deals, ${result.stageHistoriesFetched} stage histories.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
