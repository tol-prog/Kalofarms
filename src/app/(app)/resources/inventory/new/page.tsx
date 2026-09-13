import { db, schema } from "@/db";
import { PageHeader } from "@/components/ui/page-header";
import { createInventoryItem } from "@/lib/actions/resources-actions";

export default async function NewInventoryItemPage() {
  const warehouses = await db.select().from(schema.warehouses);
  const singleWarehouse = warehouses.length === 1 ? warehouses[0] : null;

  return (
    <div>
      <PageHeader title="New Inventory Type" />
      <form action={createInventoryItem} className="kf-card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Name</label>
            <input name="name" required className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Variety</label>
            <input name="variety" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Category</label>
            <input name="category" className="kf-input" placeholder="Animal Feed and Hay" />
          </div>
          <div>
            <label className="kf-label">Unit</label>
            <select name="unit" className="kf-input" defaultValue="kilograms">
              <option value="kilograms">kilograms</option>
              <option value="quintals">quintals</option>
              <option value="liters">liters</option>
              <option value="bales">bales</option>
              <option value="units">units</option>
            </select>
          </div>
          <div>
            <label className="kf-label">Quantity Available</label>
            <input type="number" step="0.01" name="quantityAvailable" defaultValue={0} className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Est. Value per Unit (ETB)</label>
            <input type="number" step="0.01" name="estValuePerUnit" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Reorder Threshold</label>
            <input type="number" step="0.01" name="reorderThreshold" className="kf-input" />
          </div>
          {singleWarehouse ? (
            <div>
              <label className="kf-label">Warehouse</label>
              <input type="hidden" name="warehouseId" value={singleWarehouse.id} />
              <p className="kf-input bg-[--color-badge-muted-bg] text-gray-600">{singleWarehouse.name}</p>
            </div>
          ) : (
            <div>
              <label className="kf-label">Warehouse</label>
              <select name="warehouseId" className="kf-input">
                <option value="">None</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary w-full sm:w-auto">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
