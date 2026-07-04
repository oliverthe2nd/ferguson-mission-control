import { z } from "zod";

export const jobPlacementRowSchema = z.object({
  period: z.coerce.date(),
  visa_approved_arrivals: z.coerce.number(),
  settlement_assisted_count: z.coerce.number(),
  successfully_placed_jobs: z.coerce.number(),
  testimonial1_count: z.coerce.number(),
  testimonial2_written_count: z.coerce.number(),
  testimonial2_video_count: z.coerce.number(),
  incentives_paid_total: z.coerce.number(),
});

export type JobPlacementRow = z.infer<typeof jobPlacementRowSchema>;

export const jobPlacementSchema = z.array(jobPlacementRowSchema);
