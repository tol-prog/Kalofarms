"use server";

import { db, schema } from "@/db";
import { eq, sql } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}
function num(fd: FormData, key: string): string | null {
  const v = str(fd, key);
  return v;
}

export async function createLivestock(formData: FormData) {
  await requireUser();

  const [row] = await db
    .insert(schema.livestock)
    .values({
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
    })
    .returning();

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
  await requireUser();
  await db.delete(schema.livestock).where(eq(schema.livestock.id, id));
  revalidatePath("/livestock/animals");
  redirect("/livestock/animals");
}

export async function recordActivity(livestockId: string, formData: FormData) {
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

  await db.insert(schema.livestockActivity).values({
    livestockId,
    date: str(formData, "date") ?? new Date().toISOString().slice(0, 10),
    type: type ?? "note",
    deceasedCount: deceasedCount ? Number(deceasedCount) : null,
    newSetCount: newSetCount ? Number(newSetCount) : null,
    yieldAmount: num(formData, "yieldAmount"),
    yieldUnit: str(formData, "yieldUnit"),
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

  revalidatePath(`/livestock/animals/${livestockId}`);
  redirect(`/livestock/animals/${livestockId}`);
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
