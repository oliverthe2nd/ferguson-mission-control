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

export const pendingSubmissions = pgTable("pending_submissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  report_type: text("report_type").notNull(),
  status: text("status").notNull().default("pending"),
  submitted_by: text("submitted_by").notNull(),
  submitted_by_email: text("submitted_by_email").notNull(),
  row_count: text("row_count").notNull().default("0"),
  rows: jsonb("rows").notNull(),
  baseline_rows: jsonb("baseline_rows"),
  review_comment: text("review_comment"),
  reviewed_by: text("reviewed_by"),
  reviewed_by_email: text("reviewed_by_email"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  reviewed_at: timestamp("reviewed_at"),
});
