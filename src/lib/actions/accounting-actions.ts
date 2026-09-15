"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createAccountingCategory(formData: FormData) {
  const session = await requireUser();
  const name = str(formData, "name") ?? "Unnamed Category";
  const type = (str(formData, "type") as "income" | "expense") ?? "expense";
  await db.insert(schema.accountingCategories).values({
    name,
    description: str(formData, "description"),
    type,
    taxLine: str(formData, "taxLine"),
  });
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "accounting_category_created",
    description: `${session.displayName} added a ${type} category: ${name}.`,
  });
  revalidatePath("/accounting/categories");
  redirect("/accounting/categories");
}

export async function createTransaction(formData: FormData) {
  const session = await requireUser();
  const type = (str(formData, "type") as "income" | "expense" | "transfer") ?? "expense";
  const amount = str(formData, "amount") ?? "0";
  await db.insert(schema.transactions).values({
    date: str(formData, "date") ?? new Date().toISOString().slice(0, 10),
    categoryId: str(formData, "categoryId"),
    type,
    amount,
    description: str(formData, "description"),
    paymentMethod: str(formData, "paymentMethod"),
    createdByUserId: session.userId,
  });
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "transaction_created",
    description: `${session.displayName} recorded a ${type} transaction of ETB ${amount}${
      str(formData, "description") ? ` (${str(formData, "description")})` : ""
    }.`,
  });
  revalidatePath("/accounting/transactions");
  revalidatePath("/dashboard");
  redirect("/accounting/transactions");
}

export async function createBudget(formData: FormData) {
  const session = await requireUser();
  const categoryId = str(formData, "categoryId");
  if (!categoryId) redirect("/accounting/budgeting");
  const budgetedAmount = str(formData, "budgetedAmount") ?? "0";
  await db.insert(schema.budgets).values({
    categoryId,
    periodStart: str(formData, "periodStart") ?? new Date().toISOString().slice(0, 10),
    periodEnd: str(formData, "periodEnd") ?? new Date().toISOString().slice(0, 10),
    budgetedAmount,
    notes: str(formData, "notes"),
  });
  const [category] = await db
    .select({ name: schema.accountingCategories.name })
    .from(schema.accountingCategories)
    .where(eq(schema.accountingCategories.id, categoryId))
    .limit(1);
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "budget_created",
    description: `${session.displayName} set a budget of ETB ${budgetedAmount} for ${category?.name ?? "a category"}.`,
  });
  revalidatePath("/accounting/budgeting");
  redirect("/accounting/budgeting");
}
