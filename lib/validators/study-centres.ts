import { z } from "zod";

export const studyCentresRowSchema = z.object({
  period: z.coerce.date(),
  branch: z.enum(["Lautoka", "Port Moresby", "Lae"]),
  walkin_traffic: z.coerce.number(),
  scheduled_leads: z.coerce.number(),
  new_registrations_local: z.coerce.number(),
  offer_letters_issued: z.coerce.number(),
  active_year1_students: z.coerce.number(),
  followon_year2_year3_local: z.coerce.number(),
  followon_year2_year3_australia: z.coerce.number(),
});

export type StudyCentresRow = z.infer<typeof studyCentresRowSchema>;

export const studyCentresSchema = z.array(studyCentresRowSchema);
