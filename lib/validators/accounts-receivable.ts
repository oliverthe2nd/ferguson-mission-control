import { z } from "zod";

export const accountsReceivableRowSchema = z.object({
  school_name: z.string(),
  invoice_ref: z.string(),
  invoice_date: z.coerce.date(),
  due_date: z.coerce.date(),
  amount_aud: z.coerce.number(),
  days_outstanding: z.coerce.number(),
  last_contact_date: z.coerce.date().optional().nullable(),
  last_contact_note: z.string().optional().nullable(),
});

export type AccountsReceivableRow = z.infer<typeof accountsReceivableRowSchema>;

export const accountsReceivableSchema = z.array(accountsReceivableRowSchema);
