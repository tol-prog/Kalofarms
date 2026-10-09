import { db, schema } from "@/db";
import { PageHeader } from "@/components/ui/page-header";
import { createFeedType } from "@/lib/actions/resources-actions";

export default async function NewFeedTypePage() {
  const warehouses = await db.select().from(schema.warehouses);
  const singleWarehouse = warehouses.length === 1 ? warehouses[0] : null;

  return (
    <div>
      <PageHeader
        title="Add Feed Type"
        description="Creates the inventory line for this feed, then takes you straight to its first recipe. That's what makes it show up here on Feed Types, same as the others."
      />
      <form action={createFeedType} className="kf-card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Name</label>
            <input name="name" required className="kf-input" placeholder="e.g. Grower Chicken Feed" />
          </div>
          <div>
            <label className="kf-label">Variety</label>
            <input name="variety" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Category</label>
            <input name="category" className="kf-input" placeholder="Finished Feed" defaultValue="Finished Feed" />
          </div>
          <div>
            <label className="kf-label">Unit</label>
            <select name="unit" className="kf-input" defaultValue="quintals">
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
            <p className="text-xs text-gray-400 mt-1">Usually 0; stock gets added once the first batch is made.</p>
          </div>
          <div>
            <label className="kf-label">Price paid per unit (ETB)</label>
            <input type="number" step="0.01" name="initialUnitCost" className="kf-input" placeholder="If you already have stock" />
          </div>
          <div>
            <label className="kf-label">Est. Value per Unit (ETB)</label>
            <input type="number" step="0.01" name="estValuePerUnit" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Reorder Threshold</label>
            <input type="number" step="0.01" name="reorderThreshold" className="kf-input" />
            <p className="text-xs text-gray-400 mt-1">Feed types don&apos;t use restock alerts; the fix is making another batch.</p>
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
            Create &amp; Add First Recipe
          </button>
        </div>
      </form>
    </div>
  );
}
