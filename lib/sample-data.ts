import type { AccountsReceivableRow } from "./validators/accounts-receivable";
import type { EnrolmentMilestoneRow } from "./validators/enrolment-milestones";
import enrolmentMilestonesRaw from "./enrolment-milestones-data.json";
import type { JobPlacementRow } from "./validators/job-placement";
import type { SalesPipelineRow } from "./validators/sales-pipeline";
import type { StudyCentresRow } from "./validators/study-centres";
import type { VisaLodgementRow } from "./validators/visa-lodgement";
import visaLodgementRaw from "./visa-lodgement-data.json";

const d = (iso: string) => new Date(iso);
const dn = (iso: string | null) => (iso ? d(iso) : null);

export const sampleSales: SalesPipelineRow[] = [
  {
    period_start: d("2026-06-09"),
    leads_facebook: 45,
    leads_website: 32,
    leads_walkin: 18,
    leads_other: 5,
    total_registrations: 22,
    lead_to_reg_pct: 24.5,
    avg_days_reg_to_offer: 3.2,
    avg_days_offer_to_first_payment: 18.5,
  },
  {
    period_start: d("2026-06-16"),
    leads_facebook: 52,
    leads_website: 28,
    leads_walkin: 22,
    leads_other: 8,
    total_registrations: 25,
    lead_to_reg_pct: 26.1,
    avg_days_reg_to_offer: 3.5,
    avg_days_offer_to_first_payment: 20.1,
  },
  {
    period_start: d("2026-06-23"),
    leads_facebook: 48,
    leads_website: 35,
    leads_walkin: 15,
    leads_other: 6,
    total_registrations: 24,
    lead_to_reg_pct: 25.8,
    avg_days_reg_to_offer: 3.8,
    avg_days_offer_to_first_payment: 22.4,
  },
  {
    period_start: d("2026-06-30"),
    leads_facebook: 55,
    leads_website: 40,
    leads_walkin: 20,
    leads_other: 10,
    total_registrations: 18,
    lead_to_reg_pct: 15.2,
    avg_days_reg_to_offer: 4.2,
    avg_days_offer_to_first_payment: 28.6,
  },
];

export const sampleEnrolment: EnrolmentMilestoneRow[] = enrolmentMilestonesRaw.map(
  (row) => ({
    student_id: row.student_id,
    student_name: row.student_name,
    registration_date: dn(row.registration_date),
    m1_target: dn(row.m1_target),
    m1_actual: dn(row.m1_actual),
    m2_target: dn(row.m2_target),
    m2_actual: dn(row.m2_actual),
    m3_target: dn(row.m3_target),
    m3_actual: dn(row.m3_actual),
    m4_target: dn(row.m4_target),
    m4_actual: dn(row.m4_actual),
    m5_target: dn(row.m5_target),
    m5_actual: dn(row.m5_actual),
  }),
);

export const sampleVisa: VisaLodgementRow[] = visaLodgementRaw.map((row) => ({
  period: d(row.period),
  visa_subclass: row.visa_subclass,
  lodged_count: row.lodged_count,
  refused_count: row.refused_count,
  processing_count: row.processing_count,
  pending_actions_count: row.pending_actions_count,
  avg_days_file_to_lodgement: row.avg_days_file_to_lodgement,
}));

export const sampleAccounts: AccountsReceivableRow[] = [
  {
    school_name: "University of Sydney",
    invoice_ref: "INV-2026-0142",
    invoice_date: d("2026-03-15"),
    due_date: d("2026-04-15"),
    amount_aud: 12500,
    days_outstanding: 78,
    last_contact_date: d("2026-06-20"),
    last_contact_note: "Second follow-up sent",
  },
  {
    school_name: "TAFE NSW",
    invoice_ref: "INV-2026-0156",
    invoice_date: d("2026-04-01"),
    due_date: d("2026-05-01"),
    amount_aud: 8400,
    days_outstanding: 62,
    last_contact_date: d("2026-06-15"),
    last_contact_note: "Awaiting accounts response",
  },
  {
    school_name: "Griffith University",
    invoice_ref: "INV-2026-0168",
    invoice_date: d("2026-04-20"),
    due_date: d("2026-05-20"),
    amount_aud: 15200,
    days_outstanding: 43,
    last_contact_date: d("2026-06-28"),
    last_contact_note: "Initial follow-up call made",
  },
  {
    school_name: "CQUniversity",
    invoice_ref: "INV-2026-0181",
    invoice_date: d("2026-01-10"),
    due_date: d("2026-02-10"),
    amount_aud: 22000,
    days_outstanding: 142,
    last_contact_date: d("2026-05-01"),
    last_contact_note: "Legal demand issued",
  },
];

export const samplePlacement: JobPlacementRow[] = [
  {
    period: d("2026-04-01"),
    visa_approved_arrivals: 18,
    settlement_assisted_count: 16,
    successfully_placed_jobs: 12,
    testimonial1_count: 8,
    testimonial2_written_count: 5,
    testimonial2_video_count: 2,
    incentives_paid_total: 1850,
  },
  {
    period: d("2026-05-01"),
    visa_approved_arrivals: 22,
    settlement_assisted_count: 20,
    successfully_placed_jobs: 15,
    testimonial1_count: 10,
    testimonial2_written_count: 6,
    testimonial2_video_count: 3,
    incentives_paid_total: 2250,
  },
  {
    period: d("2026-06-01"),
    visa_approved_arrivals: 25,
    settlement_assisted_count: 23,
    successfully_placed_jobs: 18,
    testimonial1_count: 12,
    testimonial2_written_count: 8,
    testimonial2_video_count: 4,
    incentives_paid_total: 2750,
  },
];

export const sampleCentres: StudyCentresRow[] = [
  {
    period: d("2026-06-09"),
    branch: "Lautoka",
    walkin_traffic: 42,
    scheduled_leads: 28,
    new_registrations_local: 8,
    offer_letters_issued: 6,
    active_year1_students: 45,
    followon_year2_year3_local: 12,
    followon_year2_year3_australia: 18,
  },
  {
    period: d("2026-06-09"),
    branch: "Port Moresby",
    walkin_traffic: 55,
    scheduled_leads: 35,
    new_registrations_local: 12,
    offer_letters_issued: 9,
    active_year1_students: 62,
    followon_year2_year3_local: 15,
    followon_year2_year3_australia: 22,
  },
  {
    period: d("2026-06-09"),
    branch: "Lae",
    walkin_traffic: 38,
    scheduled_leads: 22,
    new_registrations_local: 6,
    offer_letters_issued: 5,
    active_year1_students: 38,
    followon_year2_year3_local: 8,
    followon_year2_year3_australia: 14,
  },
  {
    period: d("2026-06-23"),
    branch: "Lautoka",
    walkin_traffic: 45,
    scheduled_leads: 30,
    new_registrations_local: 9,
    offer_letters_issued: 8,
    active_year1_students: 48,
    followon_year2_year3_local: 14,
    followon_year2_year3_australia: 20,
  },
  {
    period: d("2026-06-23"),
    branch: "Port Moresby",
    walkin_traffic: 52,
    scheduled_leads: 33,
    new_registrations_local: 11,
    offer_letters_issued: 8,
    active_year1_students: 63,
    followon_year2_year3_local: 14,
    followon_year2_year3_australia: 21,
  },
  {
    period: d("2026-06-23"),
    branch: "Lae",
    walkin_traffic: 36,
    scheduled_leads: 20,
    new_registrations_local: 5,
    offer_letters_issued: 4,
    active_year1_students: 39,
    followon_year2_year3_local: 8,
    followon_year2_year3_australia: 13,
  },
];
