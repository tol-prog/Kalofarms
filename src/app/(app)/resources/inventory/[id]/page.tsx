import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { formatNumber, formatDate } from "@/lib/format";
import { adjustInventory, deleteInventoryItem, updateTransactionCost } from "@/lib/actions/resources-actions";
import { InventoryHistoryChart } from "./history-chart";
import { FlaskConical, Pencil, Trash2, AlertTriangle } from "lucide-react";

export const dynamic = "force-dynamic";

const REDUCING_TYPES = new Set(["remove", "recipe_consume", "feeding_consume"]);

export default async function InventoryItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;
  const session = await getSession();
  const [item] = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, id)).limit(1);
  if (!item) notFound();

  const [warehouse, txns, recipeUsingThis] = await Promise.all([
    item.warehouseId
      ? db.select().from(schema.warehouses).where(eq(schema.warehouses.id, item.warehouseId)).then((r) => r[0])
      : Promise.resolve(null),
    db
      .select()
      .from(schema.inventoryTransactions)
      .where(eq(schema.inventoryTransactions.itemId, id))
      .orderBy(asc(schema.inventoryTransactions.date)),
    db
      .select({ id: schema.inventoryRecipes.id })
      .from(schema.inventoryRecipes)
      .where(eq(schema.inventoryRecipes.producesItemId, id))
      .limit(1),
  ]);

  // A "feed type" — produced by at least one recipe, so it can be drawn
  // down for Kalo's own flock rather than only sold or removed as waste.
  const isFeedItem = recipeUsingThis.length > 0;

  const chartData = txns.map((t) => ({
    date: formatDate(t.date),
    quantity: t.resultingQuantity ? parseFloat(t.resultingQuantity) : 0,
  }));

  const boundAdjust = adjustInventory.bind(null, id);
  const boundDelete = deleteInventoryItem.bind(null, id);

  return (
    <div>
      <PageHeader
        title={item.name}
        description={`${formatNumber(item.quantityAvailable)} ${item.unit} available`}
        actions={
          <div className="flex gap-2">
            <Link href={`/resources/inventory/${id}/edit`} className="kf-btn-secondary flex items-center gap-1.5">
              <Pencil size={14} /> Edit
            </Link>
            <Link href={`/resources/inventory/${id}/recipes`} className="kf-btn-secondary flex items-center gap-1.5">
              <FlaskConical size={14} /> Recipes
            </Link>
            {session?.role === "admin" && (
              <form action={boundDelete}>
                <button type="submit" className="kf-btn-secondary flex items-center gap-1.5 text-[--color-danger]">
                  <Trash2 size={14} /> Delete
                </button>
              </form>
            )}
          </div>
        }
      />

      {error === "used-in-recipe" && (
        <div
          className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-md border text-sm font-medium"
          style={{ background: "var(--color-warning-bg)", borderColor: "#f0e0b0", color: "var(--color-warning)" }}
        >
          <AlertTriangle size={16} />
          Can&apos;t delete &mdash; {item.name} is used as an ingredient in one or more recipes. Remove it from those recipes
          first.
        </div>
      )}

      <div className="kf-card p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3">Inventory History</h2>
        {chartData.length < 2 ? (
          <p className="text-sm text-gray-400 py-8 text-center">Not enough history yet to chart.</p>
        ) : (
          <InventoryHistoryChart data={chartData} />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 kf-card overflow-x-auto">
          <table className="w-full kf-table">
            <thead>
              <tr>
                <th>Warehouse</th>
                <th>Current</th>
                <th>Avg. Cost</th>
                <th>Stock Value</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{warehouse?.name ?? "All Locations"}</td>
                <td>
                  {formatNumber(item.quantityAvailable)} {item.unit}
                </td>
                <td>{item.avgUnitCost ? `ETB ${formatNumber(item.avgUnitCost)}/${item.unit}` : "—"}</td>
                <td>
                  {item.avgUnitCost
                    ? `ETB ${formatNumber(parseFloat(item.quantityAvailable) * parseFloat(item.avgUnitCost))}`
                    : item.estValuePerUnit
                      ? `ETB ${formatNumber(parseFloat(item.quantityAvailable) * parseFloat(item.estValuePerUnit))}`
                      : "—"}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="p-4 border-t" style={{ borderColor: "var(--color-card-border)" }}>
            <h3 className="text-xs font-semibold uppercase text-gray-500 mb-2">Recent Transactions</h3>
            {txns.length === 0 ? (
              <p className="text-sm text-gray-400">No transactions recorded yet.</p>
            ) : (
              <ul className="text-sm space-y-2">
                {txns
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((t) => (
                    <li key={t.id}>
                      <div className="flex justify-between gap-2">
                        <span className="capitalize text-gray-600">{t.type.replace(/_/g, " ")}</span>
                        <span className="font-medium">
                          {REDUCING_TYPES.has(t.type) ? "-" : "+"}
                          {formatNumber(t.amount)} {item.unit}
                          {t.unitCost && <span className="text-gray-400 font-normal"> @ ETB {formatNumber(t.unitCost)}</span>}
                        </span>
                        <span className="text-gray-400 shrink-0">{formatDate(t.date)}</span>
                      </div>
                      {t.type === "add" && t.unitCost && (
                        <details className="mt-0.5">
                          <summary className="text-[11px] text-[--color-primary] cursor-pointer select-none">
                            Wrong price? Edit this batch
                          </summary>
                          <form
                            action={updateTransactionCost.bind(null, t.id, id)}
                            className="flex items-center gap-2 mt-1.5 pb-1"
                          >
                            <input
                              type="number"
                              step="0.01"
                              name="unitCost"
                              required
                              defaultValue={t.unitCost}
                              className="kf-input text-xs py-1 w-28"
                            />
                            <button type="submit" className="kf-btn-secondary text-xs py-1 px-2">
                              Save &amp; recalculate
                            </button>
                          </form>
                        </details>
                      )}
                    </li>
                  ))}
              </ul>
            )}
          </div>
        </div>

        <div className="kf-card p-5 h-fit">
          <h2 className="text-sm font-semibold mb-3">Adjust Stock</h2>
          <form action={boundAdjust} className="space-y-3">
            <div>
              <label className="kf-label">Action</label>
              <select name="type" className="kf-input" defaultValue="add">
                <option value="add">Add</option>
                <option value="remove">Remove</option>
                <option value="adjust">Set exact amount</option>
                {isFeedItem && <option value="feeding_consume">Used Internally (Kalo Flock Feed)</option>}
              </select>
            </div>
            <div>
              <label className="kf-label">Amount ({item.unit})</label>
              <input type="number" step="0.01" name="amount" required className="kf-input" />
            </div>
            <div>
              <label className="kf-label">Price paid per unit (ETB)</label>
              <input type="number" step="0.01" name="unitCost" className="kf-input" placeholder="Only used for Add" />
            </div>
            <div>
              <label className="kf-label">Notes</label>
              <input type="text" name="notes" className="kf-input" />
            </div>
            <button type="submit" className="kf-btn-primary w-full">
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
