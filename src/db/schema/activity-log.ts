import { pgTable, uuid, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./users";

// A lightweight, append-only audit trail: who did what, and when. Read by
// admins on the Activity Log page. Never blocks the action it records —
// see src/lib/activity-log.ts.
export const activityLogs = pgTable("activity_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  // Denormalized so the log still reads sensibly if a user is ever removed.
  userName: text("user_name").notNull(),
  // Short machine key grouping similar events, e.g. "harvest_logged", "egg_sale".
  action: text("action").notNull(),
  // Human-readable one-line summary shown in the log ("Logged harvest: 210 regular, 8 oversized eggs — Layer Chicken").
  description: text("description").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type ActivityLog = typeof activityLogs.$inferSelect;
