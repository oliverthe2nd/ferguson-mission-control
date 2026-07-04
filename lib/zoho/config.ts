export const ZOHO_API_DOMAIN =
  process.env.ZOHO_API_DOMAIN ?? "https://www.zohoapis.com.au";

export const ZOHO_ACCOUNTS_DOMAIN =
  process.env.ZOHO_ACCOUNTS_DOMAIN ?? "https://accounts.zoho.com.au";

export const ZOHO_SYNC_WEEKS = Number(process.env.ZOHO_SYNC_WEEKS ?? "12");

export function isZohoConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_CLIENT_ID &&
      process.env.ZOHO_CLIENT_SECRET &&
      process.env.ZOHO_REFRESH_TOKEN,
  );
}
