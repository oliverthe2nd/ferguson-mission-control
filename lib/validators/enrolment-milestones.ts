import { z } from "zod";

const optionalDate = z
  .union([z.coerce.date(), z.literal(""), z.null(), z.undefined()])
  .transform((v) => (v === "" || v === null || v === undefined ? null : v));

export const enrolmentMilestoneRowSchema = z.object({
  student_id: z.coerce.string(),
  student_name: z.coerce.string(),
  registration_date: optionalDate,
  m1_target: optionalDate,
  m1_actual: optionalDate,
  m2_target: optionalDate,
  m2_actual: optionalDate,
  m3_target: optionalDate,
  m3_actual: optionalDate,
  m4_target: optionalDate,
  m4_actual: optionalDate,
  m5_target: optionalDate,
  m5_actual: optionalDate,
});

export type EnrolmentMilestoneRow = z.infer<typeof enrolmentMilestoneRowSchema>;

export const enrolmentMilestonesSchema = z.array(enrolmentMilestoneRowSchema);
