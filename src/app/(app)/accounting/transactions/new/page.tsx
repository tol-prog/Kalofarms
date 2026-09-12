import { db, schema } from "@/db";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { createTransaction } from "@/lib/actions/accounting-actions";

export default async function NewTransactionPage() {
  const categories = await db.select().from(schema.accountingCategories).orderBy(asc(schema.accountingCategories.name));

  return (
    <div>
      <PageHeader title="Add Transaction" />
      <form action={createTransaction} className="kf-card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Date</label>
            <input type="date" name="date" required className="kf-input" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="kf-label">Type</label>
            <select name="type" className="kf-input" defaultValue="expense">
              <option value="income">Income</option>
              <option value="expense">Expense</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="kf-label">Category</label>
            <select name="categoryId" className="kf-input">
              <option value="">Uncategorized</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.type})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="kf-label">Amount (ETB)</label>
            <input type="number" step="0.01" name="amount" required className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Payment Method</label>
            <input name="paymentMethod" className="kf-input" placeholder="Cash, Bank Transfer…" />
          </div>
          <div className="col-span-2">
            <label className="kf-label">Description</label>
            <input name="description" className="kf-input" />
          </div>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary">
            Save Transaction
          </button>
        </div>
      </form>
    </div>
  );
}
