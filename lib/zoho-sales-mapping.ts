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
 * - Deal Pipelines: Standard (Standard), Study Centre, YESSFUND
 */

/** Exact Zoho Deals `Stage` values for Standard (and YESSFUND fallback) milestones. */
export const ZOHO_DEAL_STAGES = {
  registration: "Paid / Waiting Reg Form",
  offer: "Offer Letter Received",
  firstPayment: "1st Consult Paid",
} as const;

export type ZohoDealStage =
  (typeof ZOHO_DEAL_STAGES)[keyof typeof ZOHO_DEAL_STAGES];

/** Dashboard pipeline labels stored on sales_pipeline rows. */
export const SALES_PIPELINE_LABELS = [
  "Standard",
  "Study Centre",
  "YESSFUND",
] as const;

export type SalesPipelineLabel = (typeof SALES_PIPELINE_LABELS)[number];

/**
 * Zoho CRM Pipeline picklist / display values → dashboard label.
 * UI shows "Standard (Standard)", "Study Centre", "YESSFUND".
 */
export const ZOHO_PIPELINE_API_TO_LABEL: Record<string, SalesPipelineLabel> = {
  "Standard (Standard)": "Standard",
  Standard: "Standard",
  "Study Centre": "Study Centre",
  StudyCentre: "Study Centre",
  YESSFUND: "YESSFUND",
  "YESS Fund": "YESSFUND",
  Yessfund: "YESSFUND",
};

export const TRACKED_ZOHO_PIPELINES = new Set(
  Object.keys(ZOHO_PIPELINE_API_TO_LABEL),
);

/** Deal is converted once it enters registration or any later stage (Standard map). */
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

/**
 * Study Centre stage names used for the centres enrolment pipeline chart.
 * When Zoho stages differ, unknown stages are still counted under their raw name.
 */
export const STUDY_CENTRE_PIPELINE_STAGES = [
  "Registered / Payment Made",
  "Payment Confirmed (Kim)",
  "Enrolment In Progress",
  "Offer Letter / Installment Pending",
  "Installment Paid (Kim)",
  "Fee Paid / Laptop Cleared",
  "Cleared to Start Studies",
] as const;

/** Per-pipeline registration-or-later stage sets. */
export const PIPELINE_REGISTRATION_OR_LATER: Record<
  SalesPipelineLabel,
  readonly string[]
> = {
  Standard: ZOHO_REGISTRATION_OR_LATER_STAGES,
  YESSFUND: ZOHO_REGISTRATION_OR_LATER_STAGES,
  // Study Centre: any named stage counts; registration milestone uses first known SC stage
  "Study Centre": [
    ...STUDY_CENTRE_PIPELINE_STAGES,
    ZOHO_DEAL_STAGES.registration,
    ZOHO_DEAL_STAGES.offer,
    ZOHO_DEAL_STAGES.firstPayment,
    ...ZOHO_REGISTRATION_OR_LATER_STAGES,
  ],
};

export const PIPELINE_MILESTONE_STAGES: Record<
  SalesPipelineLabel,
  { registration: string; offer: string; firstPayment: string }
> = {
  Standard: {
    registration: ZOHO_DEAL_STAGES.registration,
    offer: ZOHO_DEAL_STAGES.offer,
    firstPayment: ZOHO_DEAL_STAGES.firstPayment,
  },
  YESSFUND: {
    registration: ZOHO_DEAL_STAGES.registration,
    offer: ZOHO_DEAL_STAGES.offer,
    firstPayment: ZOHO_DEAL_STAGES.firstPayment,
  },
  "Study Centre": {
    registration: "Registered / Payment Made",
    offer: "Offer Letter / Installment Pending",
    firstPayment: "Installment Paid (Kim)",
  },
};

const REGISTRATION_OR_LATER_BY_PIPELINE: Record<
  SalesPipelineLabel,
  Set<string>
> = {
  Standard: new Set(PIPELINE_REGISTRATION_OR_LATER.Standard),
  YESSFUND: new Set(PIPELINE_REGISTRATION_OR_LATER.YESSFUND),
  "Study Centre": new Set(PIPELINE_REGISTRATION_OR_LATER["Study Centre"]),
};

export function normalizeZohoPipeline(
  raw: string | { name?: string; display_value?: string } | null | undefined,
): SalesPipelineLabel | null {
  if (raw == null) return null;
  const value =
    typeof raw === "string"
      ? raw.trim()
      : (raw.name ?? raw.display_value ?? "").trim();
  if (!value) return null;
  return ZOHO_PIPELINE_API_TO_LABEL[value] ?? null;
}

export function isConvertedDealStage(
  stage: string | null | undefined,
  pipeline: SalesPipelineLabel = "Standard",
): boolean {
  if (!stage) return false;
  return REGISTRATION_OR_LATER_BY_PIPELINE[pipeline].has(stage);
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
    fields: [
      "Stage",
      "Pipeline",
      "Lead_Source",
      "Created_Time",
      "Modified_Time",
    ] as const,
  },
} as const;

/**
 * Metric definitions aligned to `SalesPipelineRow` in validators/sales-pipeline.ts.
 * Stage timing requires Zoho stage history / transition timestamps per deal.
 */
export const ZOHO_SALES_METRICS = {
  leadVolumeBySource:
    "Count Leads per week by Lead_Source bucket (walk-in always 0 for now). Attributed to Standard pipeline.",
  totalRegistrations:
    "Count deals that entered registration milestone in the week, per Pipeline.",
  leadToRegPct: "total_registrations / total_leads_in_week × 100 (Standard)",
  avgDaysRegToOffer:
    "Mean days from lead Created_Time to offer stage transition.",
  avgDaysOfferToFirstPayment:
    "Mean days from offer to first-payment stage transition.",
} as const;
