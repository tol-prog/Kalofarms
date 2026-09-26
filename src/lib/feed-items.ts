import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { toKg, costPerKg } from "@/lib/units";

/**
 * IDs of inventory items produced by at least one recipe — i.e. "feed
 * types" made in-house from raw materials, as opposed to purchased stock.
 * These are excluded from restock alerts everywhere (dashboard + inventory
 * list): there's nothing to "reorder" for a feed type — the fix is to make
 * another batch from its recipe, not to buy more of it.
 */
export async function getFeedItemIds(): Promise<Set<string>> {
  const rows = await db
    .select({ producesItemId: schema.inventoryRecipes.producesItemId })
    .from(schema.inventoryRecipes)
    .groupBy(schema.inventoryRecipes.producesItemId);
  return new Set(rows.map((r) => r.producesItemId));
}

/**
 * Live "direct cost of the mix" per unit of each feed item, computed right
 * now from its recipe(s) and its ingredients' current weighted-average
 * costs — NOT the same as the feed's own avgUnitCost, which only updates
 * when a batch is actually made via "Make Recipe". This lets the inventory
 * list show what a feed is worth at any given moment (e.g. before the very
 * first batch has ever been made), by re-pricing the recipe against
 * whatever ingredient costs are on hand right now.
 *
 * When an item has more than one recipe, the recipes' per-unit costs are
 * averaged. A recipe missing a cost for any ingredient is skipped for that
 * item (rather than understating it) unless it's the only recipe, in which
 * case a partial cost is still better than showing nothing.
 */
export async function getFeedDirectCosts(): Promise<Map<string, number>> {
  const recipes = await db.select().from(schema.inventoryRecipes);
  if (recipes.length === 0) return new Map();

  const result = new Map<string, number[]>();

  for (const recipe of recipes) {
    const rawIngredients = await db
      .select({
        amount: schema.inventoryRecipeIngredients.amount,
        unit: schema.inventoryRecipeIngredients.unit,
        avgUnitCost: schema.inventoryItems.avgUnitCost,
        itemUnit: schema.inventoryItems.unit,
      })
      .from(schema.inventoryRecipeIngredients)
      .innerJoin(schema.inventoryItems, eq(schema.inventoryItems.id, schema.inventoryRecipeIngredients.ingredientItemId))
      .where(eq(schema.inventoryRecipeIngredients.recipeId, recipe.id));

    if (rawIngredients.length === 0) continue;

    const knownCosts = rawIngredients.filter((ing) => ing.avgUnitCost);
    if (knownCosts.length === 0) continue;

    const totalCost = knownCosts.reduce((sum, ing) => {
      const amountKg = toKg(parseFloat(ing.amount), ing.unit);
      return sum + amountKg * costPerKg(parseFloat(ing.avgUnitCost!), ing.itemUnit);
    }, 0);

    const makesAmount = parseFloat(recipe.recipeMakesAmount);
    if (makesAmount <= 0) continue;

    // Recipe output is added directly to the produced item's stock in its
    // own unit (see makeRecipe), so cost-per-unit-produced is simply the
    // total cost divided by the recipe's makes-amount.
    const perUnit = totalCost / makesAmount;
    const existing = result.get(recipe.producesItemId) ?? [];
    existing.push(perUnit);
    result.set(recipe.producesItemId, existing);
  }

  const averaged = new Map<string, number>();
  for (const [itemId, costs] of result) {
    averaged.set(itemId, costs.reduce((a, b) => a + b, 0) / costs.length);
  }
  return averaged;
}
