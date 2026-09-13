import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatNumber, formatDate } from "@/lib/format";
import { adjustInventory } from "@/lib/actions/resources-actions";
import { InventoryHistoryChart } from "./history-chart";
import { FlaskConical } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryItemDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item] = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, id)).limit(1);
  if (!item) notFound();

  const [warehouse, txns] = await Promise.all([
    item.warehouseId
      ? db.select().from(schema.warehouses).where(eq(schema.warehouses.id, item.warehouseId)).then((r) => r[0])
      : Promise.resolve(null),
    db
      .select()
      .from(schema.inventoryTransactions)
      .where(eq(schema.inventoryTransactions.itemId, id))
      .orderBy(asc(schema.inventoryTransactions.date)),
  ]);

  const chartData = txns.map((t) => ({
    date: formatDate(t.date),
    quantity: t.resultingQuantity ? parseFloat(t.resultingQuantity) : 0,
  }));

  const boundAdjust = adjustInventory.bind(null, id);

  return (
    <div>
      <PageHeader
        title={item.name}
        description={`${formatNumber(item.quantityAvailable)} ${item.unit} available`}
        actions={
          <Link href={`/resources/inventory/${id}/recipes`} className="kf-btn-secondary flex items-center gap-1.5">
            <FlaskConical size={14} /> Recipes
          </Link>
        }
      />

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
              <ul className="text-sm space-y-1.5">
                {txns
                  .slice()
                  .reverse()
                  .slice(0, 10)
                  .map((t) => (
                    <li key={t.id} className="flex justify-between gap-2">
                      <span className="capitalize text-gray-600">{t.type.replace("_", " ")}</span>
                      <span className="font-medium">
                        {t.type === "remove" || t.type === "recipe_consume" ? "-" : "+"}
                        {formatNumber(t.amount)} {item.unit}
                        {t.unitCost && <span className="text-gray-400 font-normal"> @ ETB {formatNumber(t.unitCost)}</span>}
                      </span>
                      <span className="text-gray-400 shrink-0">{formatDate(t.date)}</span>
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
