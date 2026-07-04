import { z } from "zod";

/** Empty CSV cells must stay null — z.coerce.date() alone turns null into epoch (1970-01-01). */
const optionalDate = z.preprocess(
  (value) => {
    if (value === "" || value === null || value === undefined) return null;
    return value;
  },
  z.union([
    z.null(),
    z.coerce.date().refine((date) => !Number.isNaN(date.getTime()), {
      message: "Invalid date",
    }),
  ]),
);

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
