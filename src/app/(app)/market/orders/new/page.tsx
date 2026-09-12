import { db, schema } from "@/db";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { createOrder } from "@/lib/actions/market-actions";
import { OrderItemsEditor } from "./order-items-editor";

export default async function NewOrderPage() {
  const [contacts, products] = await Promise.all([
    db.select().from(schema.contacts).orderBy(asc(schema.contacts.name)),
    db.select().from(schema.products).orderBy(asc(schema.products.name)),
  ]);

  return (
    <div>
      <PageHeader title="Add Order" />
      <form action={createOrder} className="kf-card p-6 max-w-2xl space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Customer</label>
            <select name="contactId" className="kf-input">
              <option value="">Walk-in</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="kf-label">Date</label>
            <input type="date" name="date" className="kf-input" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="kf-label">Status</label>
            <select name="status" className="kf-input" defaultValue="pending">
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="fulfilled">Fulfilled</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
          <div>
            <label className="kf-label">Payment Method</label>
            <input name="paymentMethod" className="kf-input" />
          </div>
        </div>

        <OrderItemsEditor products={products.map((p) => ({ id: p.id, name: p.name, price: p.price }))} />

        <div>
          <label className="kf-label">Notes</label>
          <textarea name="notes" rows={2} className="kf-input" />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary">
            Create Order
          </button>
        </div>
      </form>
    </div>
  );
}
