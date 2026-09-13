import { db, schema } from "@/db";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { quickAddInventory } from "@/lib/actions/resources-actions";
import { PackagePlus } from "lucide-react";

export const dynamic = "force-dynamic";

/**
 * "Add Inventory" from the dashboard. Only ever restocks an item that
 * already exists in the Inventory list — new inventory TYPES are created
 * from the Inventory section itself (New Inventory Type), never from here.
 */
export default async function ReceiveInventoryPage() {
  const items = await db
    .select()
    .from(schema.inventoryItems)
    .orderBy(asc(schema.inventoryItems.name));

  return (
    <div className="max-w-xl">
      <PageHeader title="Add Inventory" description="Record stock received for an existing item." />

      {items.length === 0 ? (
        <div className="kf-card p-8 text-center text-gray-400">No inventory items yet.</div>
      ) : (
        <form action={quickAddInventory} className="kf-card p-5 space-y-4">
          <div>
            <label className="kf-label">Item</label>
            <select name="itemId" required className="kf-input" defaultValue="">
              <option value="" disabled>
                Choose an item…
              </option>
              {items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                  {item.variety ? ` (${item.variety})` : ""} — {item.quantityAvailable} {item.unit} in stock
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="kf-label">Amount received</label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              name="amount"
              required
              className="kf-input text-lg"
              placeholder="0"
            />
          </div>
          <div>
            <label className="kf-label">Price paid per unit (ETB)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              inputMode="decimal"
              name="unitCost"
              className="kf-input text-lg"
              placeholder="0"
            />
            <p className="text-xs text-gray-400 mt-1">Prices change — this updates the item&apos;s weighted-average cost.</p>
          </div>
          <div>
            <label className="kf-label">Notes</label>
            <input type="text" name="notes" className="kf-input" placeholder="e.g. supplier, delivery note #" />
          </div>
          <button type="submit" className="kf-btn-primary w-full flex items-center justify-center gap-2 py-2.5">
            <PackagePlus size={16} /> Add to Inventory
          </button>
        </form>
      )}
    </div>
  );
}
