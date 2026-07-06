/**
 * Data needed from FEG teams to replace SAMPLE ONLY views.
 * Export for admin/docs; keep in sync with lib/framework/pillar-resolve.ts checks.
 */
export type DataRequirement = {
  pillar: string;
  item: string;
  source: string;
  owner: string;
  blocker: boolean;
};

export const DATA_REQUIREMENTS: DataRequirement[] = [
  // Sales & Marketing — Zoho
  {
    pillar: "Sales & Marketing",
    item: "Walk-in Zoho fields: Name, Client ID, Inquiry topic, Email, Phone",
    source: "Zoho CRM Leads module",
    owner: "Mikey / Zoho admin",
    blocker: true,
  },
  {
    pillar: "Sales & Marketing",
    item: "Seminar as separate Lead Source (not merged with walk-in)",
    source: "Zoho CRM Lead_Source picklist",
    owner: "Mikey / Zoho admin",
    blocker: true,
  },
  {
    pillar: "Sales & Marketing",
    item: "Registration confirmed stage (Kim verification) — stage name + stage-change timestamp",
    source: "Zoho CRM Deals stage history",
    owner: "Mikey / Kim",
    blocker: true,
  },
  {
    pillar: "Sales & Marketing",
    item: "Daily lead records for drill-down (lead id, source, created date, contact)",
    source: "Zoho CRM API",
    owner: "Mikey",
    blocker: false,
  },
  {
    pillar: "Sales & Marketing",
    item: "OAuth scopes: Stage_History (settings.fields.READ, settings.related_lists.READ)",
    source: "Zoho OAuth",
    owner: "Oliver",
    blocker: true,
  },
  // Enrolment & Finance — Zoho
  {
    pillar: "Enrolment & Finance",
    item: "Five fee payment dates: First Consult, Tuition, Visa Lodge, OSHC, Second Consult",
    source: "Zoho CRM / finance fields",
    owner: "Mikey / finance team",
    blocker: true,
  },
  {
    pillar: "Enrolment & Finance",
    item: "Invoice date + payment received date per fee (for avg days calc)",
    source: "Zoho / accounting",
    owner: "Finance",
    blocker: true,
  },
  {
    pillar: "Enrolment & Finance",
    item: "Student-level records with registration date for monthly drill-down",
    source: "Zoho or data entry upload",
    owner: "Enrolment team",
    blocker: false,
  },
  // Visa Team
  {
    pillar: "Visa Team",
    item: "File-level data: visa stage entry date → lodgement date (turnaround)",
    source: "Visa tracker / Zoho",
    owner: "Maria / Rose",
    blocker: true,
  },
  {
    pillar: "Visa Team",
    item: "Pending actions split: S56, biometrics, medicals (per file or weekly aggregate)",
    source: "Rose consolidated spreadsheet → upload",
    owner: "Rose",
    blocker: true,
  },
  {
    pillar: "Visa Team",
    item: "Refusal records with date and subclass",
    source: "Rose / visa tracker",
    owner: "Rose",
    blocker: false,
  },
  {
    pillar: "Visa Team",
    item: "Officer email mapping for automated day-8 reminders",
    source: "Internal HR / ops",
    owner: "Oliver",
    blocker: false,
  },
  // Study Centre
  {
    pillar: "Study Centre",
    item: "Walk-in captures in Zoho per branch (Lautoka, Port Moresby, Lae)",
    source: "Zoho CRM",
    owner: "Menah / Albert",
    blocker: true,
  },
  {
    pillar: "Study Centre",
    item: "Kim-verification stage pipeline counts (7 stages)",
    source: "Zoho Deals stages",
    owner: "Mikey / Kim",
    blocker: true,
  },
  {
    pillar: "Study Centre",
    item: "Avg days registration → offer letter, offer → 1st installment",
    source: "Zoho stage history",
    owner: "Study centre leads",
    blocker: true,
  },
  {
    pillar: "Study Centre",
    item: "Year 1 / Year 2 cohort seed data by start date",
    source: "Nikhil backfill spreadsheet",
    owner: "Nikhil",
    blocker: false,
  },
  // Job Placement
  {
    pillar: "Job Placement",
    item: "Monthly testimonial written + video counts",
    source: "Spreadsheet upload (current)",
    owner: "Gigi / HR",
    blocker: false,
  },
  // Accounts
  {
    pillar: "Accounts",
    item: "MYOB export CSV (school, invoice, dates, amount, days outstanding)",
    source: "MYOB export — Kim",
    owner: "Kim",
    blocker: false,
  },
  // Cross-cutting
  {
    pillar: "Cross-cutting",
    item: "Resend API key + recipient lists for 8am reminder emails",
    source: "Resend + Vercel cron",
    owner: "Oliver",
    blocker: false,
  },
  {
    pillar: "Cross-cutting",
    item: "Clerk editor role for entry-only staff logins",
    source: "Clerk publicMetadata role: editor",
    owner: "Oliver",
    blocker: false,
  },
];

export function getBlockerRequirements(): DataRequirement[] {
  return DATA_REQUIREMENTS.filter((r) => r.blocker);
}
