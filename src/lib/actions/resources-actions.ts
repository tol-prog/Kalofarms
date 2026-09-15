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

// --- Equipment ----------------------------------------------------------

export async function createEquipment(formData: FormData) {
  const session = await requireUser();
  const name = str(formData, "name") ?? "Unnamed Equipment";
  await db.insert(schema.equipment).values({
    name,
    type: str(formData, "type"),
    make: str(formData, "make"),
    model: str(formData, "model"),
    purchaseDate: str(formData, "purchaseDate"),
    purchasePrice: str(formData, "purchasePrice"),
    status: (str(formData, "status") as "operational" | "needs_service" | "out_of_service" | "sold") ?? "operational",
    notes: str(formData, "notes"),
  });
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "equipment_created",
    description: `${session.displayName} added equipment: ${name}.`,
  });
  revalidatePath("/resources/equipment");
  redirect("/resources/equipment");
}

export async function addEquipmentMaintenance(equipmentId: string, formData: FormData) {
  const session = await requireUser();
  const description = str(formData, "description") ?? "Service";
  await db.insert(schema.equipmentMaintenance).values({
    equipmentId,
    date: str(formData, "date") ?? new Date().toISOString().slice(0, 10),
    description,
    cost: str(formData, "cost"),
    performedBy: str(formData, "performedBy"),
  });
  const [equip] = await db.select({ name: schema.equipment.name }).from(schema.equipment).where(eq(schema.equipment.id, equipmentId)).limit(1);
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "equipment_maintenance_logged",
    description: `${session.displayName} logged maintenance on ${equip?.name ?? "equipment"}: ${description}.`,
  });
  revalidatePath(`/resources/equipment`);
}

// --- Warehouses -----------------------------------------------------------

export async function createWarehouse(formData: FormData) {
  const session = await requireUser();
  const name = str(formData, "name") ?? "Unnamed Warehouse";
  await db.insert(schema.warehouses).values({
    name,
    location: str(formData, "location"),
    notes: str(formData, "notes"),
  });
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "warehouse_created",
    description: `${session.displayName} added warehouse: ${name}.`,
  });
  revalidatePath("/resources/warehouses");
  redirect("/resources/warehouses");
}

// --- Inventory --------------------------------------------------------

/** Shared by createInventoryItem and the new-inventory-type form: when the
 * farm has exactly one warehouse, every new item belongs to it automatically. */
async function resolveWarehouseId(formData: FormData): Promise<string | null> {
  const submitted = str(formData, "warehouseId");
  if (submitted) return submitted;
  const warehouses = await db.select({ id: schema.warehouses.id }).from(schema.warehouses);
  return warehouses.length === 1 ? warehouses[0].id : null;
}

export async function createInventoryItem(formData: FormData) {
  const session = await requireUser();
  const name = str(formData, "name") ?? "Unnamed Item";
  const initialQty = parseFloat(str(formData, "quantityAvailable") ?? "0") || 0;
  const initialUnitCost = str(formData, "initialUnitCost");
  const [row] = await db
    .insert(schema.inventoryItems)
    .values({
      name,
      variety: str(formData, "variety"),
      category: str(formData, "category"),
      unit: str(formData, "unit") ?? "kilograms",
      quantityAvailable: str(formData, "quantityAvailable") ?? "0",
      estValuePerUnit: str(formData, "estValuePerUnit"),
      reorderThreshold: str(formData, "reorderThreshold"),
      warehouseId: await resolveWarehouseId(formData),
      // Starting fresh, so the "weighted average" is just what was paid —
      // no prior stock to weight against.
      avgUnitCost: initialQty > 0 && initialUnitCost ? initialUnitCost : null,
    })
    .returning();
  if (initialQty > 0 && initialUnitCost) {
    await db.insert(schema.inventoryTransactions).values({
      itemId: row.id,
      type: "add",
      amount: String(initialQty),
      resultingQuantity: String(initialQty),
      unitCost: initialUnitCost,
      notes: "Opening stock",
      createdByUserId: session.userId,
    });
  }
  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "inventory_item_created",
    description: `${session.displayName} created a new inventory type: ${name}.`,
  });
  revalidatePath("/resources/inventory");
  redirect(`/resources/inventory/${row.id}`);
}

/** Moving weighted-average cost: only receipts (with a price paid) shift the
 * average — consumption/removal never changes an item's cost basis. */
function weightedAverageCost(
  currentQty: number,
  currentAvgCost: number | null,
  addedQty: number,
  addedUnitCost: number
): number {
  if (currentAvgCost === null || currentQty <= 0) return addedUnitCost;
  const totalQty = currentQty + addedQty;
  if (totalQty <= 0) return addedUnitCost;
  return (currentQty * currentAvgCost + addedQty * addedUnitCost) / totalQty;
}

/** Core add/remove/set-exact logic shared by the per-item "Adjust Stock" form
 * and the dashboard's "Add Inventory" quick action (quickAddInventory below).
 * `unitCost` — price paid per unit — is only meaningful (and only applied)
 * when type === "add", since prices fluctuate and we want a running
 * weighted-average cost to price recipes/feed against. */
async function applyInventoryAdjustment(
  itemId: string,
  type: "add" | "remove" | "adjust",
  amount: number,
  notes: string | null,
  session: { userId: string; displayName: string },
  unitCost?: number | null
) {
  const [item] = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, itemId)).limit(1);
  if (!item) return null;

  const current = parseFloat(item.quantityAvailable);
  let next = current;
  if (type === "add") next = current + amount;
  else if (type === "remove") next = Math.max(current - amount, 0);
  else next = amount;

  const hasCost = type === "add" && typeof unitCost === "number" && unitCost > 0;
  const currentAvgCost = item.avgUnitCost ? parseFloat(item.avgUnitCost) : null;
  const newAvgCost = hasCost ? weightedAverageCost(current, currentAvgCost, amount, unitCost!) : currentAvgCost;

  await db
    .update(schema.inventoryItems)
    .set({ quantityAvailable: String(next), ...(hasCost ? { avgUnitCost: String(newAvgCost) } : {}) })
    .where(eq(schema.inventoryItems.id, itemId));

  await db.insert(schema.inventoryTransactions).values({
    itemId,
    type,
    amount: String(amount),
    resultingQuantity: String(next),
    unitCost: hasCost ? String(unitCost) : null,
    notes,
    createdByUserId: session.userId,
  });

  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "inventory_adjusted",
    description:
      type === "adjust"
        ? `${session.displayName} set ${item.name} to ${next} ${item.unit}.`
        : `${session.displayName} ${type === "add" ? "added" : "removed"} ${amount} ${item.unit} ${
            type === "add" ? "to" : "from"
          } ${item.name} (now ${next} ${item.unit})${hasCost ? ` at ETB ${unitCost}/${item.unit}` : ""}.`,
  });

  return item;
}

export async function adjustInventory(itemId: string, formData: FormData) {
  const session = await requireUser();
  const type = (str(formData, "type") as "add" | "remove" | "adjust") ?? "add";
  const amount = parseFloat(str(formData, "amount") ?? "0");
  const unitCost = str(formData, "unitCost");

  await applyInventoryAdjustment(itemId, type, amount, str(formData, "notes"), session, unitCost ? parseFloat(unitCost) : null);

  revalidatePath(`/resources/inventory/${itemId}`);
  revalidatePath("/resources/inventory");
}

/** "Add Inventory" from the dashboard: restock an EXISTING item only — picked
 * from a dropdown, never free text — since new item types are only created
 * from the Inventory section itself (see createInventoryItem above). */
export async function quickAddInventory(formData: FormData) {
  const session = await requireUser();
  const itemId = str(formData, "itemId");
  if (!itemId) redirect("/resources/inventory/receive");

  const amount = parseFloat(str(formData, "amount") ?? "0");
  const unitCost = str(formData, "unitCost");
  await applyInventoryAdjustment(itemId, "add", amount, str(formData, "notes"), session, unitCost ? parseFloat(unitCost) : null);

  revalidatePath("/resources/inventory");
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// --- Recipes ------------------------------------------------------------

export async function createRecipe(itemId: string, formData: FormData) {
  const session = await requireUser();
  const recipeName = str(formData, "name") ?? "Unnamed Recipe";

  const [recipe] = await db
    .insert(schema.inventoryRecipes)
    .values({
      name: recipeName,
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

  await logActivity({
    userId: session.userId,
    userName: session.displayName,
    action: "recipe_created",
    description: `${session.displayName} created a new recipe: ${recipeName}.`,
  });

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

  // Direct raw-material cost of THIS batch, from each ingredient's current
  // weighted-average cost — rolled into the produced item's own cost below.
  // Only credited when EVERY ingredient has a known cost, so a partial sum
  // never silently understates the produced feed's cost basis.
  let batchIngredientCost = 0;
  let allIngredientCostsKnown = ingredients.length > 0;

  for (const ing of ingredients) {
    const [item] = await db
      .select()
      .from(schema.inventoryItems)
      .where(eq(schema.inventoryItems.id, ing.ingredientItemId))
      .limit(1);
    if (!item) {
      allIngredientCostsKnown = false;
      continue;
    }
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

    if (item.avgUnitCost) {
      batchIngredientCost += consume * parseFloat(item.avgUnitCost);
    } else {
      allIngredientCostsKnown = false;
    }
  }

  const [producedItem] = await db
    .select()
    .from(schema.inventoryItems)
    .where(eq(schema.inventoryItems.id, recipe.producesItemId))
    .limit(1);
  if (producedItem) {
    const produced = parseFloat(recipe.recipeMakesAmount) * batches;
    const next = parseFloat(producedItem.quantityAvailable) + produced;

    // Cost per unit produced, from this batch's ingredients — rolled into
    // the feed's own weighted-average cost so it carries a real cost basis
    // for pricing (only when every ingredient's cost was known).
    const currentAvgCost = producedItem.avgUnitCost ? parseFloat(producedItem.avgUnitCost) : null;
    const costPerUnitProduced = allIngredientCostsKnown && produced > 0 ? batchIngredientCost / produced : null;
    const newAvgCost =
      costPerUnitProduced !== null
        ? weightedAverageCost(parseFloat(producedItem.quantityAvailable), currentAvgCost, produced, costPerUnitProduced)
        : currentAvgCost;

    await db
      .update(schema.inventoryItems)
      .set({ quantityAvailable: String(next), ...(newAvgCost !== null ? { avgUnitCost: String(newAvgCost) } : {}) })
      .where(eq(schema.inventoryItems.id, producedItem.id));
    await db.insert(schema.inventoryTransactions).values({
      itemId: producedItem.id,
      type: "recipe_produce",
      amount: String(produced),
      resultingQuantity: String(next),
      unitCost: costPerUnitProduced !== null ? String(costPerUnitProduced) : null,
      notes: `Made via recipe: ${recipe.name}`,
      createdByUserId: session.userId,
    });

    await logActivity({
      userId: session.userId,
      userName: session.displayName,
      action: "recipe_made",
      description: `${session.displayName} made ${batches} batch${batches !== 1 ? "es" : ""} of ${recipe.name} (+${produced} ${producedItem.unit} ${producedItem.name}${
        costPerUnitProduced !== null ? `, direct cost ETB ${costPerUnitProduced.toFixed(2)}/${producedItem.unit}` : ""
      }).`,
    });
  }

  revalidatePath(`/resources/inventory/${recipe.producesItemId}`);
  redirect(`/resources/inventory/${recipe.producesItemId}`);
}
