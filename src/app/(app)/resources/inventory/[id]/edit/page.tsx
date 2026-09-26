import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { updateInventoryItem } from "@/lib/actions/resources-actions";
export default async function EditInventoryItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item, warehouses] = await Promise.all([
    db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, id)).then((r) => r[0]),
    db.select().from(schema.warehouses),
  ]);
  if (!item) notFound();
  const boundUpdate = updateInventoryItem.bind(null, id);
  return (
    <div>
      <PageHeader title={`Edit — ${item.name}`} />
      <form action={boundUpdate} className="kf-card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Name</label>
            <input name="name" required defaultValue={item.name} className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Variety</label>
            <input name="variety" defaultValue={item.variety ?? ""} className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Category</label>
            <input name="category" defaultValue={item.category ?? ""} className="kf-input" placeholder="Animal Feed and Hay" />
          </div>
          <div>
            <label className="kf-label">Unit</label>
            <select name="unit" className="kf-input" defaultValue={item.unit}>
              <option value="kilograms">kilograms</option>
              <option value="quintals">quintals</option>
              <option value="liters">liters</option>
              <option value="bales">bales</option>
              <option value="units">units</option>
            </select>
          </div>
          <div>
            <label className="kf-label">Est. Value per Unit (ETB)</label>
            <input type="number" step="0.01" name="estValuePerUnit" defaultValue={item.estValuePerUnit ?? ""} className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Reorder Threshold</label>
            <input type="number" step="0.01" name="reorderThreshold" defaultValue={item.reorderThreshold ?? ""} className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Warehouse</label>
            <select name="warehouseId" className="kf-input" defaultValue={item.warehouseId ?? ""}>
              <option value="">None</option>
              {warehouses.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-gray-400">
          Quantity on hand and weighted-average cost aren&apos;t edited here — use Adjust Stock on the item page for those, so
          the cost history stays accurate.
        </p>
        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary w-full sm:w-auto">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
