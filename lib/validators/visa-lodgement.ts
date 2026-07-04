import { z } from "zod";

const optionalMetric = z
  .union([z.coerce.number(), z.literal(""), z.null(), z.undefined()])
  .transform((v) => {
    if (v === "" || v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  });

export const visaLodgementRowSchema = z.object({
  period: z.coerce.date(),
  visa_subclass: z.coerce.string(),
  lodged_count: z.coerce.number(),
  refused_count: z.coerce.number(),
  processing_count: optionalMetric,
  pending_actions_count: optionalMetric,
  avg_days_file_to_lodgement: optionalMetric,
});

export type VisaLodgementRow = z.infer<typeof visaLodgementRowSchema>;

export const visaLodgementSchema = z.array(visaLodgementRowSchema);
