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
