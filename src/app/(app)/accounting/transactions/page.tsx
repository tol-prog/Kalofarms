import Link from "next/link";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const rows = await db
    .select({
      id: schema.transactions.id,
      date: schema.transactions.date,
      type: schema.transactions.type,
      amount: schema.transactions.amount,
      description: schema.transactions.description,
      paymentMethod: schema.transactions.paymentMethod,
      categoryName: schema.accountingCategories.name,
    })
    .from(schema.transactions)
    .leftJoin(schema.accountingCategories, eq(schema.accountingCategories.id, schema.transactions.categoryId))
    .orderBy(desc(schema.transactions.date));

  return (
    <div>
      <PageHeader
        title="Transactions"
        actions={
          <Link href="/accounting/transactions/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Transaction
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Payment Method</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  No transactions recorded yet.
                </td>
              </tr>
            )}
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{formatDate(t.date)}</td>
                <td>{t.categoryName ?? "Uncategorized"}</td>
                <td>{t.description ?? "—"}</td>
                <td>{t.paymentMethod ?? "—"}</td>
                <td>
                  <Badge variant={t.type === "income" ? "active" : "danger"}>
                    {t.type === "income" ? "+" : "-"}
                    {formatMoney(t.amount)}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
