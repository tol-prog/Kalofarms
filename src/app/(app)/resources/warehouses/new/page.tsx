import { PageHeader } from "@/components/ui/page-header";
import { createWarehouse } from "@/lib/actions/resources-actions";

export default function NewWarehousePage() {
  return (
    <div>
      <PageHeader title="Add Warehouse" />
      <form action={createWarehouse} className="kf-card p-6 max-w-md space-y-4">
        <div>
          <label className="kf-label">Name</label>
          <input name="name" required className="kf-input" />
        </div>
        <div>
          <label className="kf-label">Location</label>
          <input name="location" className="kf-input" />
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
