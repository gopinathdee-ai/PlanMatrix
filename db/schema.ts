import {
  int,
  varchar,
  bit,
  datetime2,
  text,
  sqlServer,
} from "drizzle-orm/mssql-core";
import { sql } from "drizzle-orm";
import { relations } from "drizzle-orm";

export const floorPlans = sqlServer.table("floor_plans", {
  id: int().primaryKey().identity(),
  building: varchar("building", { length: 255 }).notNull(),
  floorNumber: varchar("floor_number", { length: 50 }).notNull(),
  pdfFilename: varchar("pdf_filename", { length: 255 }).notNull(),
  pdfUrl: varchar("pdf_url", { length: 500 }).notNull(),
  uploadedAt: datetime2("uploaded_at").default(sql`CURRENT_TIMESTAMP`),
  createdBy: varchar("created_by", { length: 255 }),
});

export const markers = sqlServer.table("markers", {
  id: int().primaryKey().identity(),
  floorPlanId: int("floor_plan_id").notNull(),
  markerNumber: varchar("marker_number", { length: 50 }).notNull(),
  pixelX: int("pixel_x").notNull(),
  pixelY: int("pixel_y").notNull(),
  pdfPageNumber: int("pdf_page_number").default(1),
  createdAt: datetime2("created_at").default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqlServer.table("users", {
  id: int().primaryKey().identity(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  department: varchar("department", { length: 255 }),
  entraId: varchar("entra_id", { length: 255 }),
  isITAdmin: bit("is_it_admin").default(false),
  isSystemUser: bit("is_system_user").default(false),
  status: varchar("status", { length: 50 }).default("active"),
  createdAt: datetime2("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: datetime2("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const assignments = sqlServer.table("assignments", {
  id: int().primaryKey().identity(),
  userId: int("user_id").notNull().unique(),
  markerId: int("marker_id").notNull().unique(),
  assignedAt: datetime2("assigned_at").default(sql`CURRENT_TIMESTAMP`),
  source: varchar("source", { length: 50 }).default("manual"),
  updatedAt: datetime2("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const assignmentHistory = sqlServer.table("assignment_history", {
  id: int().primaryKey().identity(),
  userId: int("user_id").notNull(),
  oldMarkerId: int("old_marker_id"),
  newMarkerId: int("new_marker_id"),
  action: varchar("action", { length: 50 }).notNull(),
  source: varchar("source", { length: 50 }).default("manual"),
  timestamp: datetime2("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

export const settings = sqlServer.table("settings", {
  id: int().primaryKey().identity(),
  key: varchar("key", { length: 255 }).unique().notNull(),
  value: text("value").notNull(),
  updatedAt: datetime2("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const importLogs = sqlServer.table("import_logs", {
  id: int().primaryKey().identity(),
  type: varchar("type", { length: 50 }).notNull(),
  filename: varchar("filename", { length: 255 }).notNull(),
  successCount: int("success_count").default(0),
  errorCount: int("error_count").default(0),
  errors: text("errors"),
  timestamp: datetime2("timestamp").default(sql`CURRENT_TIMESTAMP`),
});

// Relations
export const floorPlansRelations = relations(floorPlans, ({ many }) => ({
  markers: many(markers),
}));

export const markersRelations = relations(markers, ({ one, many }) => ({
  floorPlan: one(floorPlans, {
    fields: [markers.floorPlanId],
    references: [floorPlans.id],
  }),
  assignment: one(assignments),
  history: many(assignmentHistory),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  assignment: one(assignments),
  history: many(assignmentHistory),
}));

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  user: one(users, {
    fields: [assignments.userId],
    references: [users.id],
  }),
  marker: one(markers, {
    fields: [assignments.markerId],
    references: [markers.id],
  }),
}));

export const assignmentHistoryRelations = relations(
  assignmentHistory,
  ({ one }) => ({
    user: one(users, {
      fields: [assignmentHistory.userId],
      references: [users.id],
    }),
    marker: one(markers, {
      fields: [assignmentHistory.newMarkerId],
      references: [markers.id],
    }),
  })
);
