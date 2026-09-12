import { db, schema } from "@/db";
import { PageHeader } from "@/components/ui/page-header";
import { createPlanting, createCropType } from "@/lib/actions/plantings-actions";

export default async function NewPlantingPage() {
  const cropTypes = await db.select().from(schema.cropTypes);

  return (
    <div>
      <PageHeader title="Add Planting" />

      <details className="kf-card p-4 mb-5 max-w-2xl">
        <summary className="text-sm font-semibold cursor-pointer">Need a new crop type first?</summary>
        <form action={createCropType} className="flex gap-2 mt-3">
          <input name="name" placeholder="Crop name" required className="kf-input" />
          <input name="category" placeholder="Category (optional)" className="kf-input" />
          <button type="submit" className="kf-btn-secondary shrink-0">
            Add Crop Type
          </button>
        </form>
      </details>

      <form action={createPlanting} className="kf-card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Crop Type</label>
            <select name="cropTypeId" required className="kf-input">
              {cropTypes.length === 0 && <option value="">No crop types yet</option>}
              {cropTypes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="kf-label">Field / Location</label>
            <input name="fieldLocation" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Area Size</label>
            <input type="number" step="0.01" name="areaSize" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Area Unit</label>
            <select name="areaUnit" className="kf-input" defaultValue="hectares">
              <option value="hectares">hectares</option>
              <option value="acres">acres</option>
              <option value="square meters">square meters</option>
            </select>
          </div>
          <div>
            <label className="kf-label">Planted Date</label>
            <input type="date" name="plantedDate" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Expected Harvest Date</label>
            <input type="date" name="expectedHarvestDate" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Expected Yield</label>
            <input type="number" step="0.01" name="expectedYield" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Yield Unit</label>
            <input name="yieldUnit" placeholder="quintals, kg…" className="kf-input" />
          </div>
        </div>
        <div>
          <label className="kf-label">Notes</label>
          <textarea name="notes" rows={3} className="kf-input" />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary">
            Create Planting
          </button>
        </div>
      </form>
    </div>
  );
}
