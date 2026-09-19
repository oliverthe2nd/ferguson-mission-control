import {
  bucketZohoLeadSource,
  isConvertedDealStage,
  normalizeZohoPipeline,
  PIPELINE_MILESTONE_STAGES,
  SALES_PIPELINE_LABELS,
  type SalesPipelineLabel,
} from "@/lib/zoho-sales-mapping";
import type { SalesPipelineRow } from "@/lib/validators/sales-pipeline";
import type { StudyCentrePipelineStage } from "@/lib/framework/types";
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

function buildStageTimeline(
  deal: ZohoDealRecord,
  history: ZohoStageHistoryEntry[],
  pipeline: SalesPipelineLabel,
) {
  const milestones = PIPELINE_MILESTONE_STAGES[pipeline];
  const registrationOrLater = new Set(
    Object.values(PIPELINE_MILESTONE_STAGES[pipeline]),
  );

  // Expand with isConvertedDealStage set via mapping helpers
  const registrationFallback =
    deal.Stage === milestones.registration
      ? parseZohoDate(deal.Stage_Modified_Time ?? deal.Modified_Time)
      : null;
  const offerFallback =
    deal.Stage === milestones.offer
      ? parseZohoDate(deal.Stage_Modified_Time ?? deal.Modified_Time)
      : null;
  const paymentFallback =
    deal.Stage === milestones.firstPayment
      ? parseZohoDate(deal.Stage_Modified_Time ?? deal.Modified_Time)
      : null;

  let registration = firstStageDate(
    history,
    milestones.registration,
    registrationFallback,
  );
  const offer = firstStageDate(history, milestones.offer, offerFallback);
  const firstPayment = firstStageDate(
    history,
    milestones.firstPayment,
    paymentFallback,
  );

  if (!registration && isConvertedDealStage(deal.Stage, pipeline)) {
    const pastRegistration = history
      .map((entry) => ({
        stage: entry.Stage,
        at: stageTimestamp(entry),
      }))
      .filter(
        (entry): entry is { stage: string; at: Date } =>
          !!entry.stage &&
          isConvertedDealStage(entry.stage, pipeline) &&
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

  void registrationOrLater;
  return { registration, offer, firstPayment };
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return round1(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function finalizeWeek(
  week: WeekAccumulator,
  pipeline: SalesPipelineLabel,
): SalesPipelineRow {
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
    pipeline,
    leads_facebook: week.leads_facebook,
    leads_website: week.leads_website,
    leads_walkin: week.leads_walkin,
    leads_seminar: 0,
    leads_other: week.leads_other,
    total_registrations: week.total_registrations,
    lead_to_reg_pct: leadToRegPct,
    avg_days_reg_to_offer: average(week.regToOfferDays),
    avg_days_offer_to_first_payment: average(week.offerToPaymentDays),
  };
}

export function aggregateSalesPipelineRows(input: {
  weekStarts: Date[];
  leads: ZohoLeadRecord[];
  deals: Array<{
    deal: ZohoDealRecord;
    history: ZohoStageHistoryEntry[];
  }>;
}): SalesPipelineRow[] {
  const weeksByPipeline = new Map<
    SalesPipelineLabel,
    Map<string, WeekAccumulator>
  >();

  for (const label of SALES_PIPELINE_LABELS) {
    weeksByPipeline.set(label, getWeekMap(input.weekStarts));
  }

  // Leads attribute to Standard (primary sales funnel); other pipelines are deal-driven.
  const standardWeeks = weeksByPipeline.get("Standard")!;
  for (const lead of input.leads) {
    const created = parseZohoDate(lead.Created_Time);
    if (!created) continue;

    const key = weekKey(created);
    const week = standardWeeks.get(key);
    if (!week) continue;

    incrementLeadBucket(week, bucketZohoLeadSource(lead.Lead_Source));
  }

  for (const { deal, history } of input.deals) {
    const pipeline = normalizeZohoPipeline(deal.Pipeline);
    if (!pipeline) continue;
    if (!isConvertedDealStage(deal.Stage, pipeline)) continue;

    const weeks = weeksByPipeline.get(pipeline);
    if (!weeks) continue;

    const matchedLead = matchLeadForDeal(input.leads, deal);
    const leadCreated =
      parseZohoDate(matchedLead?.Created_Time) ??
      parseZohoDate(deal.Created_Time);
    const { registration, offer, firstPayment } = buildStageTimeline(
      deal,
      history,
      pipeline,
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

  const rows: SalesPipelineRow[] = [];
  for (const label of SALES_PIPELINE_LABELS) {
    const weeks = weeksByPipeline.get(label)!;
    for (const start of input.weekStarts) {
      const week = weeks.get(weekKey(start)) ?? emptyWeek(start);
      rows.push(finalizeWeek(week, label));
    }
  }

  return rows;
}

export function filterConvertedDeals(deals: ZohoDealRecord[]): ZohoDealRecord[] {
  return deals.filter((deal) => {
    const pipeline = normalizeZohoPipeline(deal.Pipeline) ?? "Standard";
    return isConvertedDealStage(deal.Stage, pipeline);
  });
}

/** Current stage counts for Study Centre deals (for centres dashboard). */
export function countStudyCentreStages(
  deals: ZohoDealRecord[],
): StudyCentrePipelineStage[] {
  const counts = new Map<string, number>();

  for (const deal of deals) {
    const pipeline = normalizeZohoPipeline(deal.Pipeline);
    if (pipeline !== "Study Centre") continue;
    const stage = deal.Stage?.trim();
    if (!stage) continue;
    counts.set(stage, (counts.get(stage) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([stage, count]) => ({ stage, count }))
    .sort((a, b) => b.count - a.count);
}

/** Filter sales rows to one pipeline, or roll up all pipelines for a week view. */
export function filterSalesRowsByPipeline(
  rows: SalesPipelineRow[],
  pipeline: SalesPipelineLabel | "All",
): SalesPipelineRow[] {
  if (pipeline !== "All") {
    return rows
      .filter((row) => (row.pipeline ?? "Standard") === pipeline)
      .sort(
        (a, b) =>
          new Date(b.period_start).getTime() - new Date(a.period_start).getTime(),
      );
  }

  const byWeek = new Map<string, WeekAccumulator & { pipelines: number }>();

  for (const row of rows) {
    const key = weekKey(new Date(row.period_start));
    let week = byWeek.get(key);
    if (!week) {
      week = {
        ...emptyWeek(new Date(row.period_start)),
        pipelines: 0,
      };
      byWeek.set(key, week);
    }
    week.leads_facebook += row.leads_facebook;
    week.leads_website += row.leads_website;
    week.leads_walkin += row.leads_walkin;
    week.leads_other += row.leads_other;
    week.total_registrations += row.total_registrations;
    if (row.avg_days_reg_to_offer > 0) {
      week.regToOfferDays.push(row.avg_days_reg_to_offer);
    }
    if (row.avg_days_offer_to_first_payment > 0) {
      week.offerToPaymentDays.push(row.avg_days_offer_to_first_payment);
    }
    week.pipelines += 1;
  }

  // Leads are only on Standard — All rollup would triple-count if we summed leads.
  // Recompute: use Standard lead counts + sum registrations across pipelines.
  const standardByWeek = new Map(
    rows
      .filter((r) => (r.pipeline ?? "Standard") === "Standard")
      .map((r) => [weekKey(new Date(r.period_start)), r]),
  );

  return [...byWeek.entries()]
    .map(([key, week]) => {
      const standard = standardByWeek.get(key);
      const leadsFacebook = standard?.leads_facebook ?? 0;
      const leadsWebsite = standard?.leads_website ?? 0;
      const leadsWalkin = standard?.leads_walkin ?? 0;
      const leadsOther = standard?.leads_other ?? 0;
      const totalLeads =
        leadsFacebook + leadsWebsite + leadsWalkin + leadsOther;
      const leadToRegPct =
        totalLeads > 0
          ? round1((week.total_registrations / totalLeads) * 100)
          : 0;

      return {
        period_start: week.period_start,
        pipeline: "Standard" as SalesPipelineLabel,
        leads_facebook: leadsFacebook,
        leads_website: leadsWebsite,
        leads_walkin: leadsWalkin,
        leads_seminar: 0,
        leads_other: leadsOther,
        total_registrations: week.total_registrations,
        lead_to_reg_pct: leadToRegPct,
        avg_days_reg_to_offer: average(week.regToOfferDays),
        avg_days_offer_to_first_payment: average(week.offerToPaymentDays),
      };
    })
    .sort(
      (a, b) =>
        new Date(b.period_start).getTime() - new Date(a.period_start).getTime(),
    );
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
