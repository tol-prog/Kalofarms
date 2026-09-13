import Link from "next/link";
import { db, schema } from "@/db";
import { and, eq, gte, sql, inArray } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatNumber } from "@/lib/format";
import { FlaskConical, Plus, Wheat } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * A "feed type" is any inventory item that at least one recipe produces
 * (Layer Chicken Feed, Broiler Chicken Feed, ...). This is the picker shown
 * between "Make Recipe" / "New Recipe" and the specific recipe screen, so
 * staff choose which feed line they're working on first.
 */
export default async function FeedTypesPage() {
  const recipeCounts = await db
    .select({
      producesItemId: schema.inventoryRecipes.producesItemId,
      recipeCount: sql<number>`count(*)::int`,
    })
    .from(schema.inventoryRecipes)
    .groupBy(schema.inventoryRecipes.producesItemId);

  const itemIds = recipeCounts.map((r) => r.producesItemId);
  const items = itemIds.length
    ? await db.select().from(schema.inventoryItems).where(inArray(schema.inventoryItems.id, itemIds))
    : [];

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const madeToday = itemIds.length
    ? await db
        .select({
          itemId: schema.inventoryTransactions.itemId,
          batches: sql<number>`count(*)::int`,
          amount: sql<string>`coalesce(sum(${schema.inventoryTransactions.amount}), 0)`,
        })
        .from(schema.inventoryTransactions)
        .where(
          and(
            eq(schema.inventoryTransactions.type, "recipe_produce"),
            inArray(schema.inventoryTransactions.itemId, itemIds),
            gte(schema.inventoryTransactions.date, todayStart)
          )
        )
        .groupBy(schema.inventoryTransactions.itemId)
    : [];

  const madeTodayByItem = new Map(madeToday.map((m) => [m.itemId, m]));
  const countsByItem = new Map(recipeCounts.map((r) => [r.producesItemId, r.recipeCount]));

  const feedTypes = items
    .map((item) => ({
      item,
      recipeCount: countsByItem.get(item.id) ?? 0,
      madeToday: madeTodayByItem.get(item.id),
    }))
    .sort((a, b) => a.item.name.localeCompare(b.item.name));

  return (
    <div>
      <PageHeader
        title="Feed Types"
        description="Choose a feed line to make a batch, review its recipes, or add a new formula."
        actions={
          <Link href="/resources/inventory/new" className="kf-btn-secondary flex items-center gap-1.5">
            <Plus size={14} /> Add Feed Type
          </Link>
        }
      />

      {feedTypes.length === 0 ? (
        <div className="kf-card p-10 text-center text-gray-400">
          No feed types yet.{" "}
          <Link href="/resources/inventory/new" className="text-[--color-primary] font-medium">
            Add an inventory item
          </Link>{" "}
          for what your feed mill produces (e.g. Layer Chicken Feed), then add a recipe for it.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {feedTypes.map(({ item, recipeCount, madeToday }) => (
            <div key={item.id} className="kf-card p-5 flex flex-col gap-4">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: "var(--color-sidebar-active-bg)" }}
                >
                  <Wheat size={19} className="text-[--color-primary]" />
                </div>
                <div className="min-w-0">
                  <h2 className="font-semibold text-sm truncate">{item.name}</h2>
                  <p className="text-xs text-gray-500">
                    {formatNumber(item.quantityAvailable)} {item.unit} in stock &middot; {recipeCount} recipe
                    {recipeCount !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {madeToday ? (
                <p className="text-xs text-gray-500">
                  Made today: <span className="font-semibold text-[--color-app-text]">{madeToday.batches}</span> batch
                  {madeToday.batches !== 1 ? "es" : ""} &middot; {formatNumber(madeToday.amount)} {item.unit}
                </p>
              ) : (
                <p className="text-xs text-gray-400">No batches made today yet.</p>
              )}

              <div className="flex gap-2 mt-auto">
                <Link
                  href={`/resources/inventory/${item.id}/recipes`}
                  className="kf-btn-primary flex-1 flex items-center justify-center gap-1.5 text-sm"
                >
                  <FlaskConical size={14} /> Make Recipe
                </Link>
                <Link
                  href={`/resources/inventory/${item.id}/recipes/new`}
                  className="kf-btn-secondary flex-1 flex items-center justify-center gap-1.5 text-sm"
                >
                  <Plus size={14} /> New Recipe
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
