export const ZOHO_API_DOMAIN =
  process.env.ZOHO_API_DOMAIN ?? "https://www.zohoapis.com.au";

export const ZOHO_ACCOUNTS_DOMAIN =
  process.env.ZOHO_ACCOUNTS_DOMAIN ?? "https://accounts.zoho.com.au";

export const ZOHO_SYNC_WEEKS = Number(process.env.ZOHO_SYNC_WEEKS ?? "12");

/** For full stage-transition dates via Stage_History related-list API. */
export const ZOHO_RECOMMENDED_SCOPES =
  "ZohoCRM.modules.leads.READ,ZohoCRM.modules.deals.READ,ZohoCRM.settings.fields.READ,ZohoCRM.settings.related_lists.READ";

export function isZohoConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_CLIENT_ID &&
      process.env.ZOHO_CLIENT_SECRET &&
      process.env.ZOHO_REFRESH_TOKEN,
  );
}
