"use server";

import { db, schema } from "@/db";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createAccountingCategory(formData: FormData) {
  await requireUser();
  await db.insert(schema.accountingCategories).values({
    name: str(formData, "name") ?? "Unnamed Category",
    description: str(formData, "description"),
    type: (str(formData, "type") as "income" | "expense") ?? "expense",
    taxLine: str(formData, "taxLine"),
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
  await requireUser();
  const categoryId = str(formData, "categoryId");
  if (!categoryId) redirect("/accounting/budgeting");
  await db.insert(schema.budgets).values({
    categoryId,
    periodStart: str(formData, "periodStart") ?? new Date().toISOString().slice(0, 10),
    periodEnd: str(formData, "periodEnd") ?? new Date().toISOString().slice(0, 10),
    budgetedAmount: str(formData, "budgetedAmount") ?? "0",
    notes: str(formData, "notes"),
  });
  revalidatePath("/accounting/budgeting");
  redirect("/accounting/budgeting");
}
