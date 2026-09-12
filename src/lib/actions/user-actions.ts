"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { hashPassword } from "@/lib/auth";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createUser(formData: FormData) {
  await requireAdmin();
  const password = str(formData, "password") ?? Math.random().toString(36).slice(2, 10);
  const passwordHash = await hashPassword(password);

  await db.insert(schema.users).values({
    displayName: str(formData, "displayName") ?? "New User",
    firstName: str(formData, "firstName"),
    lastName: str(formData, "lastName"),
    email: (str(formData, "email") ?? "").toLowerCase(),
    passwordHash,
    role: (str(formData, "role") as "admin" | "operations_manager" | "staff") ?? "staff",
  });

  revalidatePath("/settings/users");
  redirect("/settings/users");
}

export async function toggleUserDisabled(userId: string, disabled: boolean) {
  await requireAdmin();
  await db.update(schema.users).set({ disabled }).where(eq(schema.users.id, userId));
  revalidatePath("/settings/users");
}
