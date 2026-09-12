import { PageHeader } from "@/components/ui/page-header";
import { createAccountingCategory } from "@/lib/actions/accounting-actions";

export default function NewAccountingCategoryPage() {
  return (
    <div>
      <PageHeader title="Add Accounting Category" />
      <form action={createAccountingCategory} className="kf-card p-6 max-w-md space-y-4">
        <div>
          <label className="kf-label">Name</label>
          <input name="name" required className="kf-input" />
        </div>
        <div>
          <label className="kf-label">Type</label>
          <select name="type" className="kf-input" defaultValue="expense">
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div>
          <label className="kf-label">Description</label>
          <input name="description" className="kf-input" />
        </div>
        <div>
          <label className="kf-label">Tax Line</label>
          <input name="taxLine" className="kf-input" />
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
