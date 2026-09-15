"use server";

import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { logActivity, describeChanges } from "@/lib/activity-log";

function str(fd: FormData, key: string): string | null {
  const v = fd.get(key);
  return typeof v === "string" && v.trim() !== "" ? v.trim() : null;
}

export async function createCropType(formData: FormData) {
  const session = await requireUser();
  const name = str(formData, "name") ?? "Unnamed Crop";
  await db.insert(schema.cropTypes).values({
    name,
    category: str(formData, "category"),
  });
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "crop_type_created",
    description: `${session.displayName} added a crop type: ${name}.`,
  });
  revalidatePath("/plantings");
}

export async function createPlanting(formData: FormData) {
  const session = await requireUser();
  const cropTypeId = str(formData, "cropTypeId");
  const [row] = await db
    .insert(schema.plantings)
    .values({
      cropTypeId,
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
  const cropType = cropTypeId
    ? (await db.select({ name: schema.cropTypes.name }).from(schema.cropTypes).where(eq(schema.cropTypes.id, cropTypeId)).limit(1))[0]
    : null;
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "planting_created",
    description: `${session.displayName} recorded a planting${cropType?.name ? ` of ${cropType.name}` : ""}${
      row.fieldLocation ? ` at ${row.fieldLocation}` : ""
    }.`,
  });
  revalidatePath("/plantings");
  redirect(`/plantings/${row.id}`);
}

const PLANTING_FIELD_LABELS = {
  status: "status",
  actualYield: "actual yield",
} as const;

export async function updatePlantingStatus(id: string, formData: FormData) {
  const session = await requireUser();
  const [before] = await db.select().from(schema.plantings).where(eq(schema.plantings.id, id)).limit(1);
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

  const changes = describeChanges(before, { status, actualYield }, PLANTING_FIELD_LABELS);
  const location = before?.fieldLocation ?? "a planting";
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "planting_status_updated",
    description:
      changes.length > 0
        ? `${session.displayName} updated ${location}: ${changes.join(", ")}.`
        : `${session.displayName} updated ${location} (no changes detected).`,
  });

  revalidatePath(`/plantings/${id}`);
  revalidatePath("/plantings");
}
