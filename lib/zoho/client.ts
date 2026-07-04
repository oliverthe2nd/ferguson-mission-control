import {
  ZOHO_ACCOUNTS_DOMAIN,
  ZOHO_API_DOMAIN,
  isZohoConfigured,
} from "./config";

type ZohoListResponse<T> = {
  data?: T[];
  info?: {
    more_records?: boolean;
    next_page_token?: string;
    page_token_expiry?: string;
  };
};

type ZohoTokenResponse = {
  access_token: string;
  expires_in: number;
  error?: string;
};

let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (!isZohoConfigured()) {
    throw new Error("Zoho CRM is not configured");
  }

  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.value;
  }

  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN!,
    client_id: process.env.ZOHO_CLIENT_ID!,
    client_secret: process.env.ZOHO_CLIENT_SECRET!,
    grant_type: "refresh_token",
  });

  const response = await fetch(
    `${ZOHO_ACCOUNTS_DOMAIN}/oauth/v2/token?${params.toString()}`,
    { method: "POST" },
  );

  const body = (await response.json()) as ZohoTokenResponse;
  if (!response.ok || !body.access_token) {
    throw new Error(body.error ?? "Failed to refresh Zoho access token");
  }

  cachedToken = {
    value: body.access_token,
    expiresAt: Date.now() + body.expires_in * 1000,
  };

  return body.access_token;
}

async function zohoFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getAccessToken();
  const response = await fetch(`${ZOHO_API_DOMAIN}/crm/v8${path}`, {
    ...init,
    headers: {
      Authorization: `Zoho-oauthtoken ${token}`,
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json()) as T & {
    code?: string;
    message?: string;
    status?: string;
  };

  if (!response.ok) {
    throw new Error(
      body.message ?? body.code ?? `Zoho API error (${response.status})`,
    );
  }

  return body;
}

export type ZohoLeadRecord = {
  id: string;
  Lead_Source?: string | null;
  Created_Time?: string;
  Converted__s?: boolean;
  Converted_Date_Time?: string | null;
};

export type ZohoDealRecord = {
  id: string;
  Stage?: string | null;
  Lead_Source?: string | null;
  Created_Time?: string;
  Stage_Modified_Time?: string;
  Modified_Time?: string;
};

export type ZohoStageHistoryEntry = {
  Stage?: string | null;
  Modified_Time?: string | null;
  Last_Modified_Time?: string | null;
};

export async function fetchAllLeadsInRange(
  startIso: string,
  endIso: string,
): Promise<ZohoLeadRecord[]> {
  const criteria = `(Created_Time:between:${startIso},${endIso})`;
  const fields = "Lead_Source,Created_Time,Converted__s,Converted_Date_Time";
  return fetchAllSearchRecords<ZohoLeadRecord>("Leads", criteria, fields);
}

export async function fetchAllDealsInRange(
  startIso: string,
  endIso: string,
): Promise<ZohoDealRecord[]> {
  const criteria = `(Created_Time:between:${startIso},${endIso})`;
  const fields = "Stage,Lead_Source,Created_Time,Stage_Modified_Time,Modified_Time";
  const created = await fetchAllSearchRecords<ZohoDealRecord>(
    "Deals",
    criteria,
    fields,
  );

  const modifiedCriteria = `(Modified_Time:between:${startIso},${endIso})`;
  const modified = await fetchAllSearchRecords<ZohoDealRecord>(
    "Deals",
    modifiedCriteria,
    fields,
  );

  const byId = new Map<string, ZohoDealRecord>();
  for (const deal of [...created, ...modified]) {
    byId.set(deal.id, deal);
  }
  return [...byId.values()];
}

async function fetchAllSearchRecords<T>(
  module: string,
  criteria: string,
  fields: string,
): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  let pageToken: string | undefined;

  while (true) {
    const params = new URLSearchParams({
      criteria,
      fields,
      per_page: "200",
      page: String(page),
    });
    if (pageToken) params.set("page_token", pageToken);

    const body = await zohoFetch<ZohoListResponse<T>>(
      `/${module}/search?${params.toString()}`,
    );

    rows.push(...(body.data ?? []));

    if (!body.info?.more_records) break;
    pageToken = body.info.next_page_token;
    if (!pageToken) {
      page += 1;
      continue;
    }
  }

  return rows;
}

export async function fetchDealStageHistory(
  dealId: string,
): Promise<ZohoStageHistoryEntry[]> {
  const params = new URLSearchParams({
    fields: "Stage,Modified_Time,Last_Modified_Time",
  });

  const body = await zohoFetch<ZohoListResponse<ZohoStageHistoryEntry>>(
    `/Deals/${dealId}/Stage_History?${params.toString()}`,
  );

  return body.data ?? [];
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const current = index++;
      results[current] = await fn(items[current]!);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}
