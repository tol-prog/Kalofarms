"use server";

import { db, schema } from "@/db";
import { eq, sql, and, desc, ilike } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}
function num(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v;
}

export async function createLivestock(formData: FormData) {
  const session = await requireUser();
  const nameOrLabel = str(formData, "nameOrLabel") ?? "Unnamed";

  const [row] = await db
    .insert(schema.livestock)
    .values({
      nameOrLabel,
      internalId: str(formData, "internalId"),
      animalType: str(formData, "animalType") ?? "Other",
      breed: str(formData, "breed"),
      tagNumber: str(formData, "tagNumber"),
      gender: str(formData, "gender"),
      numberInSet: Number(str(formData, "numberInSet") ?? "1") || 1,
      status: (str(formData, "status") as "active" | "sold" | "deceased" | "archived") ?? "active",
      locationPaddock: str(formData, "locationPaddock"),
      methodAcquired: str(formData, "methodAcquired") as "purchased" | "born_on_farm" | "gifted" | "other" | null,
      purchaseDate: str(formData, "purchaseDate"),
      birthDate: str(formData, "birthDate"),
      estimatedBreakEven: num(formData, "estimatedBreakEven"),
      notes: str(formData, "notes"),
    })
    .returning();

  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "livestock_created",
    description: `${session.displayName} added ${nameOrLabel} to livestock.`,
  });

  revalidatePath("/livestock/animals");
  redirect(`/livestock/animals/${row.id}`);
}

export async function updateLivestock(id: string, formData: FormData) {
  await requireUser();

  await db
    .update(schema.livestock)
    .set({
      nameOrLabel: str(formData, "nameOrLabel") ?? "Unnamed",
      internalId: str(formData, "internalId"),
      animalType: str(formData, "animalType") ?? "Other",
      breed: str(formData, "breed"),
      tagNumber: str(formData, "tagNumber"),
      gender: str(formData, "gender"),
      numberInSet: Number(str(formData, "numberInSet") ?? "1") || 1,
      status: (str(formData, "status") as "active" | "sold" | "deceased" | "archived") ?? "active",
      locationPaddock: str(formData, "locationPaddock"),
      methodAcquired: str(formData, "methodAcquired") as "purchased" | "born_on_farm" | "gifted" | "other" | null,
      purchaseDate: str(formData, "purchaseDate"),
      birthDate: str(formData, "birthDate"),
      estimatedBreakEven: num(formData, "estimatedBreakEven"),
      notes: str(formData, "notes"),
      updatedAt: new Date(),
    })
    .where(eq(schema.livestock.id, id));

  revalidatePath("/livestock/animals");
  revalidatePath(`/livestock/animals/${id}`);
  redirect(`/livestock/animals/${id}`);
}

export async function deleteLivestock(id: string) {
  const session = await requireUser();
  const [row] = await db.select().from(schema.livestock).where(eq(schema.livestock.id, id)).limit(1);
  await db.delete(schema.livestock).where(eq(schema.livestock.id, id));
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "livestock_deleted",
    description: `${session.displayName} removed ${row?.nameOrLabel ?? "a livestock record"}.`,
  });
  revalidatePath("/livestock/animals");
  redirect("/livestock/animals");
}

/** The single shared inventory item eggs are tracked as ("Eggs", tracked in
 * units/pieces). Broken eggs are waste, not sellable stock, so they're
 * excluded from what gets credited on harvest or debited on sale. */
async function getEggInventoryItem() {
  const [item] = await db.select().from(schema.inventoryItems).where(ilike(schema.inventoryItems.name, "Eggs")).limit(1);
  return item ?? null;
}

async function creditEggInventory(regularEggs: number, oversizedEggs: number, userId: string, note: string) {
  const sellable = regularEggs + oversizedEggs;
  if (sellable <= 0) return;
  const eggItem = await getEggInventoryItem();
  if (!eggItem) return;

  const next = parseFloat(eggItem.quantityAvailable) + sellable;
  await db.update(schema.inventoryItems).set({ quantityAvailable: String(next) }).where(eq(schema.inventoryItems.id, eggItem.id));
  await db.insert(schema.inventoryTransactions).values({
    itemId: eggItem.id,
    type: "add",
    amount: String(sellable),
    resultingQuantity: String(next),
    notes: note,
    createdByUserId: userId,
  });
}

export async function recordActivity(livestockId: string, formData: FormData) {
  await recordActivityCore(livestockId, formData, `/livestock/animals/${livestockId}#record-activity`);
}

async function recordActivityCore(livestockId: string, formData: FormData, redirectTo: string) {
  const session = await requireUser();
  const type = str(formData, "type") as
    | "change_count"
    | "harvest"
    | "weight"
    | "treatment"
    | "feeding"
    | "wellness"
    | "birth"
    | "note";

  const deceasedCount = num(formData, "deceasedCount");
  const newSetCount = num(formData, "newSetCount");

  const regularEggs = Number(num(formData, "regularEggs") ?? "0") || 0;
  const oversizedEggs = Number(num(formData, "oversizedEggs") ?? "0") || 0;
  const brokenEggs = Number(num(formData, "brokenEggs") ?? "0") || 0;
  const hasEggBreakdown = regularEggs > 0 || oversizedEggs > 0 || brokenEggs > 0;
  const totalEggs = regularEggs + oversizedEggs + brokenEggs;

  await db.insert(schema.livestockActivity).values({
    livestockId,
    date: str(formData, "date") ?? new Date().toISOString().slice(0, 10),
    type: type ?? "note",
    deceasedCount: deceasedCount ? Number(deceasedCount) : null,
    newSetCount: newSetCount ? Number(newSetCount) : null,
    regularEggs: hasEggBreakdown ? regularEggs : null,
    oversizedEggs: hasEggBreakdown ? oversizedEggs : null,
    brokenEggs: hasEggBreakdown ? brokenEggs : null,
    // Keep the generic yield fields in sync so existing summaries (dashboard,
    // reports) that read yieldAmount/yieldUnit keep working for egg harvests too.
    yieldAmount: hasEggBreakdown ? String(totalEggs) : num(formData, "yieldAmount"),
    yieldUnit: hasEggBreakdown ? "eggs" : str(formData, "yieldUnit"),
    feedAmount: num(formData, "feedAmount"),
    feedUnit: str(formData, "feedUnit"),
    weight: num(formData, "weight"),
    treatmentName: str(formData, "treatmentName"),
    withdrawalUntil: str(formData, "withdrawalUntil"),
    notes: str(formData, "notes"),
    createdByUserId: session.userId,
  });

  // Adjust the livestock record based on activity type.
  if (deceasedCount && Number(deceasedCount) > 0) {
    await db
      .update(schema.livestock)
      .set({ numberInSet: sql`GREATEST(${schema.livestock.numberInSet} - ${Number(deceasedCount)}, 0)` })
      .where(eq(schema.livestock.id, livestockId));
  }
  if (newSetCount) {
    await db
      .update(schema.livestock)
      .set({ numberInSet: Number(newSetCount) })
      .where(eq(schema.livestock.id, livestockId));
  }
  if (num(formData, "weight")) {
    await db
      .update(schema.livestock)
      .set({ lastWeight: num(formData, "weight") })
      .where(eq(schema.livestock.id, livestockId));
  }

  const [animal] = await db.select().from(schema.livestock).where(eq(schema.livestock.id, livestockId)).limit(1);
  const label = animal?.nameOrLabel ?? "livestock";

  // Harvested eggs are credited to the shared Eggs inventory item by default
  // (broken eggs are waste, excluded). Sales debit it back — see sales-actions.ts.
  if (type === "harvest" && hasEggBreakdown) {
    await creditEggInventory(regularEggs, oversizedEggs, session.userId, `Harvested from ${label}`);
  }

  const descriptions: Record<string, string> = {
    harvest: hasEggBreakdown
      ? `${session.displayName} logged a harvest for ${label}: ${regularEggs} regular, ${oversizedEggs} oversized, ${brokenEggs} broken eggs.`
      : `${session.displayName} logged a harvest for ${label}${totalEggs || num(formData, "yieldAmount") ? `: ${num(formData, "yieldAmount") ?? totalEggs} ${str(formData, "yieldUnit") ?? ""}`.trimEnd() : ""}.`,
    change_count: `${session.displayName} recorded ${deceasedCount ?? 0} deceased for ${label}.`,
    weight: `${session.displayName} recorded a weigh-in for ${label}${num(formData, "weight") ? ` (${num(formData, "weight")} kg)` : ""}.`,
    treatment: `${session.displayName} recorded a treatment for ${label}${str(formData, "treatmentName") ? `: ${str(formData, "treatmentName")}` : ""}.`,
    feeding: `${session.displayName} recorded feeding for ${label}.`,
    wellness: `${session.displayName} recorded a wellness check for ${label}.`,
    birth: `${session.displayName} recorded a birth for ${label}.`,
    note: `${session.displayName} added a note for ${label}.`,
  };
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: `activity_${type ?? "note"}`,
    description: descriptions[type ?? "note"] ?? `${session.displayName} recorded activity for ${label}.`,
  });

  revalidatePath(`/livestock/animals/${livestockId}`);
  revalidatePath("/dashboard");
  redirect(redirectTo);
}

// --- Layer Chicken harvest (dashboard "Log Today's Harvest") -----------

/** Chicken batches eligible for the harvest-logging batch picker. */
export async function getLayerBatches() {
  return db
    .select()
    .from(schema.livestock)
    .where(and(eq(schema.livestock.animalType, "Chicken"), eq(schema.livestock.status, "active")))
    .orderBy(desc(schema.livestock.numberInSet));
}

/** The livestockId used on the most recent harvest entry, to auto-select
 * "last used batch" on the harvest form. */
export async function getLastHarvestBatchId(): Promise<string | null> {
  const [last] = await db
    .select({ livestockId: schema.livestockActivity.livestockId })
    .from(schema.livestockActivity)
    .where(eq(schema.livestockActivity.type, "harvest"))
    .orderBy(desc(schema.livestockActivity.createdAt))
    .limit(1);
  return last?.livestockId ?? null;
}

/**
 * Dedicated "Log Today's Harvest" action for layer chickens: batch picked
 * from a dropdown (no free-text livestockId), egg counts only — no milk,
 * meat, or other activity types. Delegates to recordActivity so the egg
 * inventory credit and audit log stay in one place.
 */
export async function logLayerHarvest(formData: FormData) {
  const livestockId = str(formData, "livestockId");
  if (!livestockId) redirect("/livestock/harvest");

  const activityForm = new FormData();
  activityForm.set("type", "harvest");
  activityForm.set("date", str(formData, "date") ?? new Date().toISOString().slice(0, 10));
  activityForm.set("regularEggs", num(formData, "regularEggs") ?? "0");
  activityForm.set("oversizedEggs", num(formData, "oversizedEggs") ?? "0");
  activityForm.set("brokenEggs", num(formData, "brokenEggs") ?? "0");
  if (str(formData, "notes")) activityForm.set("notes", str(formData, "notes")!);

  await recordActivityCore(livestockId, activityForm, "/dashboard");
}

// --- Livestock groups -------------------------------------------------

export async function createLivestockGroup(formData: FormData) {
  await requireUser();
  const [row] = await db
    .insert(schema.livestockGroups)
    .values({
      name: str(formData, "name") ?? "Unnamed Group",
      type: (str(formData, "type") as "set" | "smart") ?? "set",
    })
    .returning();
  revalidatePath("/livestock/groups");
  redirect(`/livestock/groups/${row.id}`);
}

export async function addLivestockToGroup(groupId: string, formData: FormData) {
  await requireUser();
  const livestockId = str(formData, "livestockId");
  if (livestockId) {
    await db.insert(schema.livestockGroupMembers).values({ groupId, livestockId });
  }
  revalidatePath(`/livestock/groups/${groupId}`);
}

export async function removeLivestockFromGroup(groupId: string, memberId: string) {
  await requireUser();
  await db.delete(schema.livestockGroupMembers).where(eq(schema.livestockGroupMembers.id, memberId));
  revalidatePath(`/livestock/groups/${groupId}`);
}

// --- Grazing -----------------------------------------------------------

export async function createGrazingRecord(formData: FormData) {
  await requireUser();
  await db.insert(schema.grazingRecords).values({
    paddockName: str(formData, "paddockName") ?? "Unnamed Paddock",
    livestockGroupId: str(formData, "livestockGroupId"),
    startDate: str(formData, "startDate") ?? new Date().toISOString().slice(0, 10),
    endDate: str(formData, "endDate"),
    notes: str(formData, "notes"),
  });
  revalidatePath("/livestock/grazing");
}
