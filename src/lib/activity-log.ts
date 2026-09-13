import "server-only";
import { db, schema } from "@/db";

/**
 * Record one line in the admin Activity Log. Best-effort: a logging failure
 * must never break the real action it's describing, so errors are swallowed
 * (and reported to the server console) rather than thrown.
 */
export async function logActivity(params: {
  userId?: string | null;
  userName: string;
  action: string;
  description: string;
}) {
  try {
    await db.insert(schema.activityLogs).values({
      userId: params.userId ?? null,
      userName: params.userName,
      action: params.action,
      description: params.description,
    });
  } catch (err) {
    console.error("Failed to record activity log entry:", err);
  }
}
