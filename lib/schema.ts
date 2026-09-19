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

/** Latest Zoho deal stage counts per pipeline (e.g. Study Centre kanban). */
export const zohoPipelineStages = pgTable("zoho_pipeline_stages", {
  id: uuid("id").defaultRandom().primaryKey(),
  pipeline: text("pipeline").notNull(),
  stages: jsonb("stages").notNull(),
  synced_at: timestamp("synced_at").defaultNow().notNull(),
});

export const amaConversations = pgTable("ama_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  owner_email: text("owner_email").notNull(),
  title: text("title"),
  messages: jsonb("messages").notNull().default([]),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});

export const trackedReports = pgTable("tracked_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  owner_email: text("owner_email").notNull(),
  title: text("title").notNull(),
  question: text("question").notNull(),
  tool_plan: jsonb("tool_plan").notNull().default({}),
  schedule: text("schedule").notNull().default("daily"),
  last_run_at: timestamp("last_run_at"),
  last_result: jsonb("last_result"),
  created_at: timestamp("created_at").defaultNow().notNull(),
  updated_at: timestamp("updated_at").defaultNow().notNull(),
});
