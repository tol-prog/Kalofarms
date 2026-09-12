import { PageHeader } from "@/components/ui/page-header";
import { createContact } from "@/lib/actions/market-actions";

export default function NewContactPage() {
  return (
    <div>
      <PageHeader title="Add Contact" />
      <form action={createContact} className="kf-card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Name</label>
            <input name="name" required className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Type</label>
            <select name="type" className="kf-input" defaultValue="customer">
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="employee">Employee</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="kf-label">Email</label>
            <input type="email" name="email" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Phone</label>
            <input name="phone" className="kf-input" />
          </div>
          <div className="col-span-2">
            <label className="kf-label">Address</label>
            <input name="address" className="kf-input" />
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
