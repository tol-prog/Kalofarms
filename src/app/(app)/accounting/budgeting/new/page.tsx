import { db, schema } from "@/db";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { createBudget } from "@/lib/actions/accounting-actions";

export default async function NewBudgetPage() {
  const categories = await db.select().from(schema.accountingCategories).orderBy(asc(schema.accountingCategories.name));
  const today = new Date();
  const yearStart = `${today.getFullYear()}-01-01`;
  const yearEnd = `${today.getFullYear()}-12-31`;

  return (
    <div>
      <PageHeader title="Add Budget" />
      <form action={createBudget} className="kf-card p-6 max-w-2xl space-y-4">
        <div>
          <label className="kf-label">Category</label>
          <select name="categoryId" required className="kf-input">
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.type})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Period Start</label>
            <input type="date" name="periodStart" defaultValue={yearStart} className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Period End</label>
            <input type="date" name="periodEnd" defaultValue={yearEnd} className="kf-input" />
          </div>
        </div>
        <div>
          <label className="kf-label">Budgeted Amount (ETB)</label>
          <input type="number" step="0.01" name="budgetedAmount" required className="kf-input" />
        </div>
        <div>
          <label className="kf-label">Notes</label>
          <textarea name="notes" rows={2} className="kf-input" />
        </div>
        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary">
            Create Budget
          </button>
        </div>
      </form>
    </div>
  );
}
