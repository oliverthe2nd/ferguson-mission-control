import {
  ZOHO_ACCOUNTS_DOMAIN,
  ZOHO_API_DOMAIN,
  isZohoConfigured,
} from "./config";
import { formatZohoDateTime } from "./weeks";

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
  error_description?: string;
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
    const detail = body.error_description ?? body.error;
    if (body.error === "invalid_code") {
      throw new Error(
        "Zoho refresh token is invalid. In the Zoho API console, exchange your Self Client code for a refresh token — do not paste the short-lived code into ZOHO_REFRESH_TOKEN.",
      );
    }
    throw new Error(detail ?? "Failed to refresh Zoho access token");
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

  if (response.status === 204) {
    return {} as T;
  }

  const text = await response.text();
  const body = (
    text
      ? (JSON.parse(text) as T & {
          code?: string;
          message?: string;
          status?: string;
        })
      : {}
  ) as T & {
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
  const fields = "Lead_Source,Created_Time,Converted__s,Converted_Date_Time";
  return fetchSearchByDateRange<ZohoLeadRecord>(
    "Leads",
    "Created_Time",
    new Date(startIso),
    new Date(endIso),
    fields,
  );
}

export async function fetchAllDealsInRange(
  startIso: string,
  endIso: string,
): Promise<ZohoDealRecord[]> {
  const fields =
    "Stage,Lead_Source,Created_Time,Stage_Modified_Time,Modified_Time";
  const rangeStart = new Date(startIso);
  const rangeEnd = new Date(endIso);
  const byId = new Map<string, ZohoDealRecord>();

  for (const field of ["Created_Time", "Modified_Time"] as const) {
    for (const deal of await fetchSearchByDateRange<ZohoDealRecord>(
      "Deals",
      field,
      rangeStart,
      rangeEnd,
      fields,
    )) {
      byId.set(deal.id, deal);
    }
  }

  return [...byId.values()];
}

function isZohoSearchLimitError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("ZOHO_SEARCH_LIMIT") ||
    message.includes("maximum response iteration limit") ||
    message.includes("LIMIT_REACHED")
  );
}

async function fetchAllSearchRecords<T extends { id: string }>(
  module: string,
  criteria: string,
  fields: string,
): Promise<T[]> {
  const rows: T[] = [];
  let page = 1;
  let pageToken: string | undefined;
  const maxPageWithoutToken = 10;

  while (true) {
    const params = new URLSearchParams({
      criteria,
      fields,
      per_page: "200",
    });
    if (pageToken) {
      params.set("page_token", pageToken);
    } else {
      params.set("page", String(page));
    }

    const body = await zohoFetch<ZohoListResponse<T>>(
      `/${module}/search?${params.toString()}`,
    ).catch((error) => {
      if (isZohoSearchLimitError(error)) {
        throw new Error(`ZOHO_SEARCH_LIMIT:${module}`);
      }
      throw error;
    });

    rows.push(...(body.data ?? []));

    if (!body.info?.more_records) break;

    const nextToken = body.info.next_page_token;
    if (nextToken) {
      pageToken = nextToken;
      page = 1;
      continue;
    }

    if (page >= maxPageWithoutToken) {
      throw new Error(
        `ZOHO_SEARCH_LIMIT:${module}`,
      );
    }

    page += 1;
  }

  return rows;
}

async function fetchSearchByDateRange<T extends { id: string }>(
  module: string,
  field: "Created_Time" | "Modified_Time",
  rangeStart: Date,
  rangeEnd: Date,
  fields: string,
): Promise<T[]> {
  if (rangeStart >= rangeEnd) return [];

  const startIso = formatZohoDateTime(rangeStart);
  const endIso = formatZohoDateTime(rangeEnd);
  const criteria = `(${field}:between:${startIso},${endIso})`;

  try {
    return await fetchAllSearchRecords<T>(module, criteria, fields);
  } catch (error) {
    if (!isZohoSearchLimitError(error)) throw error;

    const spanMs = rangeEnd.getTime() - rangeStart.getTime();
    if (spanMs <= 60 * 60 * 1000) {
      throw new Error(
        `Zoho ${module} search exceeded 2000 records in one hour (${field}). Contact support to narrow sync.`,
      );
    }

    const mid = new Date((rangeStart.getTime() + rangeEnd.getTime()) / 2);
    const [left, right] = await Promise.all([
      fetchSearchByDateRange<T>(module, field, rangeStart, mid, fields),
      fetchSearchByDateRange<T>(module, field, mid, rangeEnd, fields),
    ]);

    const byId = new Map<string, T>();
    for (const row of [...left, ...right]) {
      byId.set(row.id, row);
    }
    return [...byId.values()];
  }
}

export function isZohoScopeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("OAUTH_SCOPE_MISMATCH") ||
    message.includes("invalid oauth scope")
  );
}

/** Stage_History is a related-list API — needs settings scopes, not a separate scope name. */
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

export async function fetchDealStageHistoryOptional(
  dealId: string,
): Promise<ZohoStageHistoryEntry[]> {
  try {
    return await fetchDealStageHistory(dealId);
  } catch (error) {
    if (isZohoScopeError(error)) return [];
    throw error;
  }
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
