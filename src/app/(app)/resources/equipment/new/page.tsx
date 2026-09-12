import { PageHeader } from "@/components/ui/page-header";
import { createEquipment } from "@/lib/actions/resources-actions";

export default function NewEquipmentPage() {
  return (
    <div>
      <PageHeader title="Add Equipment" />
      <form action={createEquipment} className="kf-card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Name</label>
            <input name="name" required className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Type</label>
            <input name="type" className="kf-input" placeholder="Tractor, Mill, Mixer…" />
          </div>
          <div>
            <label className="kf-label">Make</label>
            <input name="make" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Model</label>
            <input name="model" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Purchase Date</label>
            <input type="date" name="purchaseDate" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Purchase Price (ETB)</label>
            <input type="number" step="0.01" name="purchasePrice" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Status</label>
            <select name="status" className="kf-input" defaultValue="operational">
              <option value="operational">Operational</option>
              <option value="needs_service">Needs Service</option>
              <option value="out_of_service">Out of Service</option>
              <option value="sold">Sold</option>
            </select>
          </div>
        </div>
        <div>
          <label className="kf-label">Notes</label>
          <textarea name="notes" rows={3} className="kf-input" />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary">
            Create
          </button>
        </div>
      </form>
    </div>
  );
}
