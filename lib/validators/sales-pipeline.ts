import { z } from "zod";
import { SALES_PIPELINE_LABELS } from "@/lib/zoho-sales-mapping";

export const salesPipelineLabelSchema = z.enum(SALES_PIPELINE_LABELS);

export const salesPipelineRowSchema = z.object({
  period_start: z.coerce.date(),
  pipeline: salesPipelineLabelSchema.default("Standard"),
  leads_facebook: z.coerce.number(),
  leads_website: z.coerce.number(),
  leads_walkin: z.coerce.number(),
  leads_seminar: z.coerce.number().optional().default(0),
  leads_other: z.coerce.number(),
  total_registrations: z.coerce.number(),
  lead_to_reg_pct: z.coerce.number(),
  avg_days_reg_to_offer: z.coerce.number(),
  avg_days_offer_to_first_payment: z.coerce.number(),
});

export type SalesPipelineRow = z.infer<typeof salesPipelineRowSchema>;

export const salesPipelineSchema = z.array(salesPipelineRowSchema);
