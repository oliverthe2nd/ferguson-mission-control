import {
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const uploads = pgTable("uploads", {
  id: uuid("id").defaultRandom().primaryKey(),
  report_type: text("report_type").notNull(),
  uploaded_by: text("uploaded_by").notNull(),
  file_name: text("file_name").notNull(),
  row_count: text("row_count").notNull().default("0"),
  created_at: timestamp("created_at").defaultNow().notNull(),
});

export const reportSnapshots = pgTable("report_snapshots", {
  id: uuid("id").defaultRandom().primaryKey(),
  upload_id: uuid("upload_id")
    .references(() => uploads.id, { onDelete: "cascade" })
    .notNull(),
  report_type: text("report_type").notNull(),
  period_date: timestamp("period_date").notNull(),
  data: jsonb("data").notNull(),
  created_at: timestamp("created_at").defaultNow().notNull(),
});
