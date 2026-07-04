/**
 * Zoho CRM → Sales & Marketing dashboard mapping.
 *
 * Business rules (confirmed with Ferguson team):
 * - Registration: converted lead whose deal entered or passed "Paid / Waiting Reg Form"
 * - Offer: deal reaches "Offer Letter Received"
 * - First payment: deal reaches "1st Consult Paid"
 * - Timing: use Zoho stage transition dates (not Modified_Time alone)
 * - Lead sources: Meta Ads / Facebook / META → facebook; CRM Form → website;
 *   no walk-in sources yet; everything else → other
 */

/** Exact Zoho Deals `Stage` values for pipeline milestones. */
export const ZOHO_DEAL_STAGES = {
  registration: "Paid / Waiting Reg Form",
  offer: "Offer Letter Received",
  firstPayment: "1st Consult Paid",
} as const;

export type ZohoDealStage =
  (typeof ZOHO_DEAL_STAGES)[keyof typeof ZOHO_DEAL_STAGES];

/** Deal is converted once it enters registration or any later stage. */
export const ZOHO_REGISTRATION_OR_LATER_STAGES = [
  ZOHO_DEAL_STAGES.registration,
  ZOHO_DEAL_STAGES.offer,
  "Offer Letter in Progress",
  ZOHO_DEAL_STAGES.firstPayment,
  "2nd Consult Paid",
  "Invoice To Send",
  "Checklist in Progress",
  "Paid CoE Deposit",
  "Rego Payment TBC (Accounts)",
  "Visa Processing",
  "Visa Lodged",
  "Visa Approved or Refused",
  "Paid Visa Fee",
] as const;

const REGISTRATION_OR_LATER = new Set<string>(
  ZOHO_REGISTRATION_OR_LATER_STAGES,
);

export function isConvertedDealStage(stage: string | null | undefined): boolean {
  if (!stage) return false;
  return REGISTRATION_OR_LATER.has(stage);
}

/** Known Zoho Leads `Lead_Source` → dashboard bucket. No walk-in sources yet. */
export const ZOHO_LEAD_SOURCE_TO_BUCKET: Record<
  string,
  "leads_facebook" | "leads_website" | "leads_other"
> = {
  "Meta Ads": "leads_facebook",
  META: "leads_facebook",
  Facebook: "leads_facebook",
  "CRM Form": "leads_website",
};

export type LeadSourceBucket =
  | "leads_facebook"
  | "leads_website"
  | "leads_walkin"
  | "leads_other";

export function bucketZohoLeadSource(
  source: string | null | undefined,
): LeadSourceBucket {
  if (!source) return "leads_other";
  return ZOHO_LEAD_SOURCE_TO_BUCKET[source] ?? "leads_other";
}

/** Zoho modules and fields used for sales pipeline aggregation. */
export const ZOHO_SALES_FIELDS = {
  leads: {
    module: "Leads" as const,
    fields: [
      "Lead_Source",
      "Created_Time",
      "Converted__s",
      "Converted_Date_Time",
    ] as const,
  },
  deals: {
    module: "Deals" as const,
    fields: ["Stage", "Created_Time", "Modified_Time"] as const,
  },
} as const;

/**
 * Metric definitions aligned to `SalesPipelineRow` in validators/sales-pipeline.ts.
 * Stage timing requires Zoho stage history / transition timestamps per deal.
 */
export const ZOHO_SALES_METRICS = {
  leadVolumeBySource:
    "Count Leads per week by Lead_Source bucket (walk-in always 0 for now).",
  totalRegistrations:
    "Count deals that entered Paid / Waiting Reg Form in the week, or are currently at/past that stage with first entry in that week.",
  leadToRegPct: "total_registrations / total_leads_in_week × 100",
  avgDaysRegToOffer:
    "Mean days from lead Created_Time to Offer Letter Received stage transition.",
  avgDaysOfferToFirstPayment:
    "Mean days from Offer Letter Received to 1st Consult Paid stage transition.",
} as const;
