import {
  bucketZohoLeadSource,
  isConvertedDealStage,
  ZOHO_DEAL_STAGES,
  ZOHO_REGISTRATION_OR_LATER_STAGES,
} from "@/lib/zoho-sales-mapping";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";
import type {
  ZohoDealRecord,
  ZohoLeadRecord,
  ZohoStageHistoryEntry,
} from "./client";
import {
  daysBetween,
  parseZohoDate,
  weekKey,
  weekStartFromDate,
} from "./weeks";

type WeekAccumulator = {
  period_start: Date;
  leads_facebook: number;
  leads_website: number;
  leads_walkin: number;
  leads_other: number;
  total_registrations: number;
  regToOfferDays: number[];
  offerToPaymentDays: number[];
};

function emptyWeek(periodStart: Date): WeekAccumulator {
  return {
    period_start: periodStart,
    leads_facebook: 0,
    leads_website: 0,
    leads_walkin: 0,
    leads_other: 0,
    total_registrations: 0,
    regToOfferDays: [],
    offerToPaymentDays: [],
  };
}

function getWeekMap(weekStarts: Date[]): Map<string, WeekAccumulator> {
  const map = new Map<string, WeekAccumulator>();
  for (const start of weekStarts) {
    map.set(weekKey(start), emptyWeek(start));
  }
  return map;
}

function incrementLeadBucket(
  week: WeekAccumulator,
  bucket: ReturnType<typeof bucketZohoLeadSource>,
) {
  switch (bucket) {
    case "leads_facebook":
      week.leads_facebook += 1;
      break;
    case "leads_website":
      week.leads_website += 1;
      break;
    case "leads_walkin":
      week.leads_walkin += 1;
      break;
    default:
      week.leads_other += 1;
  }
}

function stageTimestamp(entry: ZohoStageHistoryEntry): Date | null {
  return parseZohoDate(entry.Modified_Time ?? entry.Last_Modified_Time);
}

function firstStageDate(
  history: ZohoStageHistoryEntry[],
  stageName: string,
  fallback?: Date | null,
): Date | null {
  const matches = history
    .map((entry) => ({
      stage: entry.Stage,
      at: stageTimestamp(entry),
    }))
    .filter(
      (entry): entry is { stage: string; at: Date } =>
        entry.stage === stageName && entry.at != null,
    );

  if (matches.length > 0) {
    return matches.reduce(
      (earliest, entry) => (entry.at < earliest ? entry.at : earliest),
      matches[0]!.at,
    );
  }

  return fallback ?? null;
}

const REGISTRATION_OR_LATER = new Set<string>(ZOHO_REGISTRATION_OR_LATER_STAGES);

function buildStageTimeline(
  deal: ZohoDealRecord,
  history: ZohoStageHistoryEntry[],
) {
  const registrationFallback =
    deal.Stage === ZOHO_DEAL_STAGES.registration
      ? parseZohoDate(deal.Stage_Modified_Time ?? deal.Modified_Time)
      : null;
  const offerFallback =
    deal.Stage === ZOHO_DEAL_STAGES.offer
      ? parseZohoDate(deal.Stage_Modified_Time ?? deal.Modified_Time)
      : null;
  const paymentFallback =
    deal.Stage === ZOHO_DEAL_STAGES.firstPayment
      ? parseZohoDate(deal.Stage_Modified_Time ?? deal.Modified_Time)
      : null;

  let registration = firstStageDate(
    history,
    ZOHO_DEAL_STAGES.registration,
    registrationFallback,
  );
  const offer = firstStageDate(
    history,
    ZOHO_DEAL_STAGES.offer,
    offerFallback,
  );
  const firstPayment = firstStageDate(
    history,
    ZOHO_DEAL_STAGES.firstPayment,
    paymentFallback,
  );

  if (!registration && isConvertedDealStage(deal.Stage)) {
    const pastRegistration = history
      .map((entry) => ({
        stage: entry.Stage,
        at: stageTimestamp(entry),
      }))
      .filter(
        (entry): entry is { stage: string; at: Date } =>
          !!entry.stage &&
          REGISTRATION_OR_LATER.has(entry.stage) &&
          entry.at != null,
      );

    if (pastRegistration.length > 0) {
      registration = pastRegistration.reduce(
        (earliest, entry) => (entry.at < earliest ? entry.at : earliest),
        pastRegistration[0]!.at,
      );
    } else {
      registration = parseZohoDate(deal.Created_Time);
    }
  }

  return { registration, offer, firstPayment };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function aggregateSalesPipelineRows(input: {
  weekStarts: Date[];
  leads: ZohoLeadRecord[];
  deals: Array<{
    deal: ZohoDealRecord;
    history: ZohoStageHistoryEntry[];
  }>;
}): SalesPipelineRow[] {
  const weeks = getWeekMap(input.weekStarts);

  for (const lead of input.leads) {
    const created = parseZohoDate(lead.Created_Time);
    if (!created) continue;

    const key = weekKey(created);
    const week = weeks.get(key);
    if (!week) continue;

    incrementLeadBucket(week, bucketZohoLeadSource(lead.Lead_Source));
  }

  for (const { deal, history } of input.deals) {
    if (!isConvertedDealStage(deal.Stage)) continue;

    const matchedLead = matchLeadForDeal(input.leads, deal);
    const leadCreated =
      parseZohoDate(matchedLead?.Created_Time) ??
      parseZohoDate(deal.Created_Time);
    const { registration, offer, firstPayment } = buildStageTimeline(
      deal,
      history,
    );

    if (registration) {
      const regKey = weekKey(registration);
      const regWeek = weeks.get(regKey);
      if (regWeek) {
        regWeek.total_registrations += 1;
      }

      if (leadCreated && offer) {
        const leadKey = weekKey(leadCreated);
        const leadWeek = weeks.get(leadKey);
        if (leadWeek) {
          leadWeek.regToOfferDays.push(daysBetween(leadCreated, offer));
        }
      }

      if (offer && firstPayment) {
        const offerKey = weekKey(offer);
        const offerWeek = weeks.get(offerKey);
        if (offerWeek) {
          offerWeek.offerToPaymentDays.push(daysBetween(offer, firstPayment));
        }
      }
    }
  }

  return input.weekStarts.map((start) => {
    const week = weeks.get(weekKey(start)) ?? emptyWeek(start);
    const totalLeads =
      week.leads_facebook +
      week.leads_website +
      week.leads_walkin +
      week.leads_other;

    const leadToRegPct =
      totalLeads > 0
        ? round1((week.total_registrations / totalLeads) * 100)
        : 0;

    return {
      period_start: week.period_start,
      leads_facebook: week.leads_facebook,
      leads_website: week.leads_website,
      leads_walkin: week.leads_walkin,
      leads_other: week.leads_other,
      total_registrations: week.total_registrations,
      lead_to_reg_pct: leadToRegPct,
      avg_days_reg_to_offer: average(week.regToOfferDays),
      avg_days_offer_to_first_payment: average(week.offerToPaymentDays),
    };
  });
}

export function filterConvertedDeals(deals: ZohoDealRecord[]): ZohoDealRecord[] {
  return deals.filter((deal) => isConvertedDealStage(deal.Stage));
}

const LEAD_DEAL_MATCH_WINDOW_MS = 48 * 60 * 60 * 1000;

function matchLeadForDeal(
  leads: ZohoLeadRecord[],
  deal: ZohoDealRecord,
): ZohoLeadRecord | null {
  const dealCreated = parseZohoDate(deal.Created_Time);
  if (!dealCreated) return null;

  let best: ZohoLeadRecord | null = null;
  let bestDelta = Infinity;

  for (const lead of leads) {
    if (!lead.Converted__s) continue;
    const convertedAt = parseZohoDate(lead.Converted_Date_Time);
    if (!convertedAt) continue;

    const delta = Math.abs(convertedAt.getTime() - dealCreated.getTime());
    if (delta > LEAD_DEAL_MATCH_WINDOW_MS || delta >= bestDelta) continue;

    if (
      deal.Lead_Source &&
      lead.Lead_Source &&
      deal.Lead_Source !== lead.Lead_Source
    ) {
      continue;
    }

    best = lead;
    bestDelta = delta;
  }

  return best;
}

export { weekStartFromDate };
