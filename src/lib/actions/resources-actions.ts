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

// --- Equipment ----------------------------------------------------------

export async function createEquipment(formData: FormData) {
  await requireUser();
  await db.insert(schema.equipment).values({
    name: str(formData, "name") ?? "Unnamed Equipment",
    type: str(formData, "type"),
    make: str(formData, "make"),
    model: str(formData, "model"),
    purchaseDate: str(formData, "purchaseDate"),
    purchasePrice: str(formData, "purchasePrice"),
    status: (str(formData, "status") as "operational" | "needs_service" | "out_of_service" | "sold") ?? "operational",
    notes: str(formData, "notes"),
  });
  revalidatePath("/resources/equipment");
  redirect("/resources/equipment");
}

export async function addEquipmentMaintenance(equipmentId: string, formData: FormData) {
  await requireUser();
  await db.insert(schema.equipmentMaintenance).values({
    equipmentId,
    date: str(formData, "date") ?? new Date().toISOString().slice(0, 10),
    description: str(formData, "description") ?? "Service",
    cost: str(formData, "cost"),
    performedBy: str(formData, "performedBy"),
  });
  revalidatePath(`/resources/equipment`);
}

// --- Warehouses -----------------------------------------------------------

export async function createWarehouse(formData: FormData) {
  await requireUser();
  await db.insert(schema.warehouses).values({
    name: str(formData, "name") ?? "Unnamed Warehouse",
    location: str(formData, "location"),
    notes: str(formData, "notes"),
  });
  revalidatePath("/resources/warehouses");
  redirect("/resources/warehouses");
}

// --- Inventory --------------------------------------------------------

export async function createInventoryItem(formData: FormData) {
  await requireUser();
  const [row] = await db
    .insert(schema.inventoryItems)
    .values({
      name: str(formData, "name") ?? "Unnamed Item",
      variety: str(formData, "variety"),
      category: str(formData, "category"),
      unit: str(formData, "unit") ?? "kilograms",
      quantityAvailable: str(formData, "quantityAvailable") ?? "0",
      estValuePerUnit: str(formData, "estValuePerUnit"),
      reorderThreshold: str(formData, "reorderThreshold"),
      warehouseId: str(formData, "warehouseId"),
    })
    .returning();
  revalidatePath("/resources/inventory");
  redirect(`/resources/inventory/${row.id}`);
}

export async function adjustInventory(itemId: string, formData: FormData) {
  const session = await requireUser();
  const type = str(formData, "type") as "add" | "remove" | "adjust";
  const amount = parseFloat(str(formData, "amount") ?? "0");

  const [item] = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, itemId)).limit(1);
  if (!item) redirect("/resources/inventory");

  const current = parseFloat(item.quantityAvailable);
  let next = current;
  if (type === "add") next = current + amount;
  else if (type === "remove") next = Math.max(current - amount, 0);
  else next = amount;

  await db
    .update(schema.inventoryItems)
    .set({ quantityAvailable: String(next) })
    .where(eq(schema.inventoryItems.id, itemId));

  await db.insert(schema.inventoryTransactions).values({
    itemId,
    type,
    amount: String(amount),
    resultingQuantity: String(next),
    notes: str(formData, "notes"),
    createdByUserId: session.userId,
  });

  revalidatePath(`/resources/inventory/${itemId}`);
  revalidatePath("/resources/inventory");
}

// --- Recipes ------------------------------------------------------------

export async function createRecipe(itemId: string, formData: FormData) {
  await requireUser();

  const [recipe] = await db
    .insert(schema.inventoryRecipes)
    .values({
      name: str(formData, "name") ?? "Unnamed Recipe",
      producesItemId: itemId,
      recipeMakesAmount: str(formData, "recipeMakesAmount") ?? "1",
      recipeMakesUnit: str(formData, "recipeMakesUnit") ?? "kilograms",
      instructions: str(formData, "instructions"),
    })
    .returning();

  const ingredientIds = formData.getAll("ingredientItemId") as string[];
  const ingredientAmounts = formData.getAll("ingredientAmount") as string[];
  const ingredientUnits = formData.getAll("ingredientUnit") as string[];

  for (let i = 0; i < ingredientIds.length; i++) {
    if (!ingredientIds[i]) continue;
    await db.insert(schema.inventoryRecipeIngredients).values({
      recipeId: recipe.id,
      ingredientItemId: ingredientIds[i],
      amount: ingredientAmounts[i] || "0",
      unit: ingredientUnits[i] || "kilograms",
    });
  }

  revalidatePath(`/resources/inventory/${itemId}/recipes`);
  redirect(`/resources/inventory/${itemId}/recipes`);
}

/** "Make Recipe": consumes ingredients, produces the output item. */
export async function makeRecipe(recipeId: string, formData: FormData) {
  const session = await requireUser();
  const batches = parseFloat(str(formData, "batches") ?? "1") || 1;

  const [recipe] = await db
    .select()
    .from(schema.inventoryRecipes)
    .where(eq(schema.inventoryRecipes.id, recipeId))
    .limit(1);
  if (!recipe) return;

  const ingredients = await db
    .select()
    .from(schema.inventoryRecipeIngredients)
    .where(eq(schema.inventoryRecipeIngredients.recipeId, recipeId));

  for (const ing of ingredients) {
    const [item] = await db
      .select()
      .from(schema.inventoryItems)
      .where(eq(schema.inventoryItems.id, ing.ingredientItemId))
      .limit(1);
    if (!item) continue;
    const consume = parseFloat(ing.amount) * batches;
    const next = Math.max(parseFloat(item.quantityAvailable) - consume, 0);
    await db
      .update(schema.inventoryItems)
      .set({ quantityAvailable: String(next) })
      .where(eq(schema.inventoryItems.id, item.id));
    await db.insert(schema.inventoryTransactions).values({
      itemId: item.id,
      type: "recipe_consume",
      amount: String(consume),
      resultingQuantity: String(next),
      notes: `Used in recipe: ${recipe.name}`,
      createdByUserId: session.userId,
    });
  }

  const [producedItem] = await db
    .select()
    .from(schema.inventoryItems)
    .where(eq(schema.inventoryItems.id, recipe.producesItemId))
    .limit(1);
  if (producedItem) {
    const produced = parseFloat(recipe.recipeMakesAmount) * batches;
    const next = parseFloat(producedItem.quantityAvailable) + produced;
    await db
      .update(schema.inventoryItems)
      .set({ quantityAvailable: String(next) })
      .where(eq(schema.inventoryItems.id, producedItem.id));
    await db.insert(schema.inventoryTransactions).values({
      itemId: producedItem.id,
      type: "recipe_produce",
      amount: String(produced),
      resultingQuantity: String(next),
      notes: `Made via recipe: ${recipe.name}`,
      createdByUserId: session.userId,
    });
  }

  revalidatePath(`/resources/inventory/${recipe.producesItemId}`);
  redirect(`/resources/inventory/${recipe.producesItemId}`);
}
