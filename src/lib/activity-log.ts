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

/**
 * Build a human-readable "field: old → new" list for an edit action, so the
 * Activity Log shows exactly what changed (a rename, a status flip, a
 * corrected number) rather than just "X updated Y". Pass the row as it was
 * before the update, the plain values being written, and a field->label map
 * for only the fields worth surfacing; unchanged fields are skipped.
 */
export function describeChanges<T extends Record<string, unknown>>(
  before: Partial<T> | null | undefined,
  after: T,
  labels: Partial<Record<keyof T, string>>
): string[] {
  if (!before) return [];
  const changes: string[] = [];
  for (const key of Object.keys(labels) as (keyof T)[]) {
    const label = labels[key];
    if (!label) continue;
    const oldVal = before[key];
    const newVal = after[key];
    const oldStr = oldVal === null || oldVal === undefined || oldVal === "" ? "(none)" : String(oldVal);
    const newStr = newVal === null || newVal === undefined || newVal === "" ? "(none)" : String(newVal);
    if (oldStr !== newStr) changes.push(`${String(label)}: "${oldStr}" → "${newStr}"`);
  }
  return changes;
}
