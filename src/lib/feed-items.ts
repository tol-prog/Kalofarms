import { db, schema } from "@/db";
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
