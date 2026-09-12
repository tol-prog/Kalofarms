import Link from "next/link";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const orders = await db
    .select({
      id: schema.orders.id,
      orderNumber: schema.orders.orderNumber,
      date: schema.orders.date,
      status: schema.orders.status,
      total: schema.orders.total,
      contactName: schema.contacts.name,
    })
    .from(schema.orders)
    .leftJoin(schema.contacts, eq(schema.contacts.id, schema.orders.contactId))
    .orderBy(desc(schema.orders.date));

  return (
    <div>
      <PageHeader
        title="Orders"
        actions={
          <Link href="/market/orders/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Order
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  No orders yet.
                </td>
              </tr>
            )}
            {orders.map((o) => (
              <tr key={o.id}>
                <td className="font-medium">{o.orderNumber}</td>
                <td>{o.contactName ?? "Walk-in"}</td>
                <td>{formatDate(o.date)}</td>
                <td>
                  <Badge variant={statusVariant(o.status)}>{o.status}</Badge>
                </td>
                <td>{formatMoney(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
