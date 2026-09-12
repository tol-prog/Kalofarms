"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createCropType(formData: FormData) {
  await requireUser();
  await db.insert(schema.cropTypes).values({
    name: str(formData, "name") ?? "Unnamed Crop",
    category: str(formData, "category"),
  });
  revalidatePath("/plantings");
}

export async function createPlanting(formData: FormData) {
  await requireUser();
  const [row] = await db
    .insert(schema.plantings)
    .values({
      cropTypeId: str(formData, "cropTypeId"),
      fieldLocation: str(formData, "fieldLocation"),
      areaSize: str(formData, "areaSize"),
      areaUnit: str(formData, "areaUnit") ?? "hectares",
      status: (str(formData, "status") as "planned" | "planted" | "growing" | "harvested" | "failed") ?? "planned",
      plantedDate: str(formData, "plantedDate"),
      expectedHarvestDate: str(formData, "expectedHarvestDate"),
      expectedYield: str(formData, "expectedYield"),
      yieldUnit: str(formData, "yieldUnit"),
      notes: str(formData, "notes"),
    })
    .returning();
  revalidatePath("/plantings");
  redirect(`/plantings/${row.id}`);
}

export async function updatePlantingStatus(id: string, formData: FormData) {
  await requireUser();
  const status = str(formData, "status") as "planned" | "planted" | "growing" | "harvested" | "failed";
  const actualYield = str(formData, "actualYield");
  await db
    .update(schema.plantings)
    .set({
      status,
      actualYield,
      actualHarvestDate: status === "harvested" ? (str(formData, "actualHarvestDate") ?? new Date().toISOString().slice(0, 10)) : undefined,
    })
    .where(eq(schema.plantings.id, id));
  revalidatePath(`/plantings/${id}`);
  revalidatePath("/plantings");
}
