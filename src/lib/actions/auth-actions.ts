"use server";

import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { login, logout, requireUser, hashPassword, verifyPassword } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  const result = await login(email, password);
  if (!result.ok) {
    return { error: result.error };
  }

  redirect(next || "/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function changePasswordAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const session = await requireUser();

  const currentPassword = String(formData.get("currentPassword") || "");
  const newPassword = String(formData.get("newPassword") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { error: "Please fill in all fields." };
  }
  if (newPassword.length < 8) {
    return { error: "New password must be at least 8 characters." };
  }
  if (newPassword !== confirmPassword) {
    return { error: "New password and confirmation don't match." };
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, session.userId)).limit(1);
  if (!user) return { error: "User not found." };

  const valid = await verifyPassword(currentPassword, user.passwordHash);
  if (!valid) return { error: "Current password is incorrect." };

  const passwordHash = await hashPassword(newPassword);
  await db
    .update(schema.users)
    .set({ passwordHash, mustChangePassword: false, updatedAt: new Date() })
    .where(eq(schema.users.id, user.id));

  await logActivity({
    userId: user.id,
    userName: user.displayName,
    action: "password_changed",
    description: `${user.displayName} changed their password.`,
  });

  redirect("/dashboard");
}
