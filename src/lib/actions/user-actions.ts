"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createUser(formData: FormData) {
  const session = await requireAdmin();
  const password = str(formData, "password") ?? Math.random().toString(36).slice(2, 10);
  const passwordHash = await hashPassword(password);
  const displayName = str(formData, "displayName") ?? "New User";

  await db.insert(schema.users).values({
    displayName,
    firstName: str(formData, "firstName"),
    lastName: str(formData, "lastName"),
    email: (str(formData, "email") ?? "").toLowerCase(),
    passwordHash,
    role: (str(formData, "role") as "admin" | "operations_manager" | "staff") ?? "staff",
  });

  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "user_created",
    description: `${session.displayName} created a new user account: ${displayName}.`,
  });

  revalidatePath("/settings/users");
  redirect("/settings/users");
}

export async function toggleUserDisabled(userId: string, disabled: boolean) {
  const session = await requireAdmin();
  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  await db.update(schema.users).set({ disabled }).where(eq(schema.users.id, userId));
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: disabled ? "user_disabled" : "user_enabled",
    description: `${session.displayName} ${disabled ? "disabled" : "enabled"} user ${target?.displayName ?? userId}.`,
  });
  revalidatePath("/settings/users");
}

/** Lets an admin reset another user's password right from the Users list,
 * instead of the user needing to know their old one. This sets the same
 * mustChangePassword flag a brand-new account starts with (see the default
 * in src/db/schema/users.ts), so the temporary password typed here only
 * gets the user back in: their very next login is sent to /change-password
 * (src/app/change-password/page.tsx) and they have to pick their own
 * password there before they can reach anything else. Nothing else about
 * the account changes, and this never touches a password the user already
 * knows unless an admin chooses to reset it. */
export async function resetUserPassword(userId: string, formData: FormData) {
  const session = await requireAdmin();
  const [target] = await db.select().from(schema.users).where(eq(schema.users.id, userId)).limit(1);
  if (!target) return;

  const newPassword = str(formData, "newPassword");
  if (!newPassword || newPassword.length < 8) {
    // Mirrors the form's own minLength={8}; this only guards a submission
    // that bypassed it, so it fails quietly rather than with an error page.
    return;
  }

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(schema.users)
    .set({ passwordHash, mustChangePassword: true, updatedAt: new Date() })
    .where(eq(schema.users.id, userId));

  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "password_reset_by_admin",
    description: `${session.displayName} reset the password for ${target.displayName}. They'll be asked to set their own password on next login.`,
  });

  revalidatePath("/settings/users");
}
