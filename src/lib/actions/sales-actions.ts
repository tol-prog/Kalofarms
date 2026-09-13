"use server";

import { db, schema } from "@/db";
import { eq, ilike, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

async function findCategoryId(nameIlike: string): Promise<string | null> {
  const [cat] = await db
    .select({ id: schema.accountingCategories.id })
    .from(schema.accountingCategories)
    .where(ilike(schema.accountingCategories.name, nameIlike))
    .limit(1);
  return cat?.id ?? null;
}

/** Feed types = inventory items produced by at least one recipe — the same
 * "finished feed" definition used on the Feed Types page. */
export async function getFeedInventoryItems() {
  const recipeCounts = await db
    .select({ producesItemId: schema.inventoryRecipes.producesItemId })
    .from(schema.inventoryRecipes)
    .groupBy(schema.inventoryRecipes.producesItemId);
  const itemIds = recipeCounts.map((r) => r.producesItemId);
  if (itemIds.length === 0) return [];
  return db.select().from(schema.inventoryItems).where(inArray(schema.inventoryItems.id, itemIds));
}

/** Reduce a specific inventory item's stock and record the transaction. */
async function debitInventory(itemId: string, amount: number, note: string, userId: string) {
  const [item] = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, itemId)).limit(1);
  if (!item) return null;
  const next = Math.max(parseFloat(item.quantityAvailable) - amount, 0);
  await db.update(schema.inventoryItems).set({ quantityAvailable: String(next) }).where(eq(schema.inventoryItems.id, itemId));
  await db.insert(schema.inventoryTransactions).values({
    itemId,
    type: "remove",
    amount: String(amount),
    resultingQuantity: String(next),
    notes: note,
    createdByUserId: userId,
  });
  return item;
}

/** "Log Sale" → Egg Sale: reduces the shared Eggs inventory item. */
export async function logEggSale(formData: FormData) {
  const session = await requireUser();
  const quantity = parseFloat(str(formData, "quantity") ?? "0") || 0;
  const amount = str(formData, "amount") ?? "0";
  const buyer = str(formData, "buyer");
  const date = str(formData, "date") ?? new Date().toISOString().slice(0, 10);

  const [eggItem] = await db.select().from(schema.inventoryItems).where(ilike(schema.inventoryItems.name, "Eggs")).limit(1);
  if (eggItem && quantity > 0) {
    await debitInventory(eggItem.id, quantity, `Sold${buyer ? ` to ${buyer}` : ""}`, session.userId);
  }

  const categoryId = await findCategoryId("Egg sales");
  const description = `Egg sale — ${quantity} eggs${buyer ? ` to ${buyer}` : ""}`;

  await db.insert(schema.transactions).values({
    date,
    categoryId,
    type: "income",
    amount,
    description,
    paymentMethod: str(formData, "paymentMethod"),
    relatedInventoryItemId: eggItem?.id ?? null,
    createdByUserId: session.userId,
  });

  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "egg_sale",
    description: `${session.displayName} logged an egg sale: ${quantity} eggs for ETB ${amount}${buyer ? ` (${buyer})` : ""}.`,
  });

  revalidatePath("/accounting/transactions");
  revalidatePath("/resources/inventory");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

/** "Log Sale" → Feed Sale: reduces the specific finished-feed item sold. */
export async function logFeedSale(formData: FormData) {
  const session = await requireUser();
  const itemId = str(formData, "itemId");
  if (!itemId) redirect("/sales/feed/new");

  const quantity = parseFloat(str(formData, "quantity") ?? "0") || 0;
  const amount = str(formData, "amount") ?? "0";
  const buyer = str(formData, "buyer");
  const date = str(formData, "date") ?? new Date().toISOString().slice(0, 10);

  const item = quantity > 0 ? await debitInventory(itemId, quantity, `Sold${buyer ? ` to ${buyer}` : ""}`, session.userId) : null;
  const soldItem =
    item ?? (await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, itemId)).limit(1))[0];

  const categoryId = str(formData, "categoryId");
  const description = `Feed sale — ${quantity} ${soldItem?.unit ?? ""} ${soldItem?.name ?? "feed"}${buyer ? ` to ${buyer}` : ""}`;

  await db.insert(schema.transactions).values({
    date,
    categoryId,
    type: "income",
    amount,
    description,
    paymentMethod: str(formData, "paymentMethod"),
    relatedInventoryItemId: itemId,
    createdByUserId: session.userId,
  });

  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "feed_sale",
    description: `${session.displayName} logged a feed sale: ${quantity} ${soldItem?.unit ?? ""} ${
      soldItem?.name ?? "feed"
    } for ETB ${amount}${buyer ? ` (${buyer})` : ""}.`,
  });

  revalidatePath("/accounting/transactions");
  revalidatePath("/resources/inventory");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}
