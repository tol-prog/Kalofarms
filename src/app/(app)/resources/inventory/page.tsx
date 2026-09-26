import Link from "next/link";
import { db, schema } from "@/db";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatMoney, formatNumber } from "@/lib/format";
import { getFeedItemIds, getFeedDirectCosts } from "@/lib/feed-items";
import { Plus, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const [items, feedItemIds, feedDirectCosts] = await Promise.all([
    db.select().from(schema.inventoryItems).orderBy(asc(schema.inventoryItems.name)),
    getFeedItemIds(),
    getFeedDirectCosts(),
  ]);

  // Stock value per row, falling back in order: actual weighted-average
  // cost (once a batch/receipt has priced it) -> the feed's live "direct
  // cost of the mix" (so a feed shows a value even before its first batch)
  // -> a manually estimated value per unit. Summed below for the
  // end-of-list grand total.
  const rows = items.map((item) => {
    const qty = parseFloat(item.quantityAvailable);
    const low = !feedItemIds.has(item.id) && item.reorderThreshold ? qty <= parseFloat(item.reorderThreshold) : false;
    const avgCost = item.avgUnitCost ? parseFloat(item.avgUnitCost) : null;
    const feedDirectCost = feedItemIds.has(item.id) ? feedDirectCosts.get(item.id) ?? null : null;
    const unitValue = avgCost ?? feedDirectCost ?? (item.estValuePerUnit ? parseFloat(item.estValuePerUnit) : null);
    const stockValue = unitValue !== null ? qty * unitValue : null;
    return { item, qty, low, avgCost, feedDirectCost, stockValue };
  });

  const totalStockValue = rows.reduce((sum, r) => sum + (r.stockValue ?? 0), 0);

  return (
    <div>
      <PageHeader
        title="Inventory"
        actions={
          <Link href="/resources/inventory/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> New Inventory Type
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Variety</th>
              <th>Category</th>
              <th>Available</th>
              <th>Avg. Cost</th>
              <th>Feed Mix Cost</th>
              <th>Stock Value</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center text-gray-400 py-10">
                  No inventory items yet.
                </td>
              </tr>
            )}
            {rows.map(({ item, qty, low, avgCost, feedDirectCost, stockValue }) => (
              <tr key={item.id}>
                <td>
                  <Link href={`/resources/inventory/${item.id}`} className="font-medium text-[--color-primary] hover:underline">
                    {item.name}
                  </Link>
                </td>
                <td>{item.variety ?? "—"}</td>
                <td>{item.category ?? "—"}</td>
                <td>
                  <span className="flex items-center gap-1.5">
                    {low && <Bell size={13} className="text-[--color-danger]" />}
                    {formatNumber(qty)} {item.unit}
                  </span>
                </td>
                <td>{avgCost !== null ? `${formatMoney(avgCost)}/${item.unit}` : "—"}</td>
                <td>
                  {feedDirectCost !== null ? (
                    <span className={avgCost === null ? "" : "text-gray-400"}>
                      {formatMoney(feedDirectCost)}/{item.unit}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td>{stockValue !== null ? formatMoney(stockValue) : "—"}</td>
              </tr>
            ))}
          </tbody>
          {rows.length > 0 && (
            <tfoot>
              <tr>
                <td colSpan={6} className="text-right font-semibold">
                  Total Stock Value
                </td>
                <td className="font-semibold">{formatMoney(totalStockValue)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  );
}
