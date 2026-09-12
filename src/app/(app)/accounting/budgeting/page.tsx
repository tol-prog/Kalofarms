import Link from "next/link";
import { db, schema } from "@/db";
import { eq, and, gte, lte } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatMoney, formatDate } from "@/lib/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function BudgetingPage() {
  const budgets = await db
    .select({
      id: schema.budgets.id,
      periodStart: schema.budgets.periodStart,
      periodEnd: schema.budgets.periodEnd,
      budgetedAmount: schema.budgets.budgetedAmount,
      categoryId: schema.budgets.categoryId,
      categoryName: schema.accountingCategories.name,
      categoryType: schema.accountingCategories.type,
    })
    .from(schema.budgets)
    .leftJoin(schema.accountingCategories, eq(schema.accountingCategories.id, schema.budgets.categoryId));

  const withActuals = await Promise.all(
    budgets.map(async (b) => {
      const actualRows = await db
        .select()
        .from(schema.transactions)
        .where(
          and(
            eq(schema.transactions.categoryId, b.categoryId),
            gte(schema.transactions.date, b.periodStart),
            lte(schema.transactions.date, b.periodEnd)
          )
        );
      const actual = actualRows.reduce((sum, t) => sum + parseFloat(t.amount), 0);
      return { ...b, actual };
    })
  );

  return (
    <div>
      <PageHeader
        title="Budgeting"
        actions={
          <Link href="/accounting/budgeting/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Budget
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Period</th>
              <th>Budgeted</th>
              <th>Actual</th>
              <th>Variance</th>
            </tr>
          </thead>
          <tbody>
            {withActuals.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  No budgets set yet.
                </td>
              </tr>
            )}
            {withActuals.map((b) => {
              const variance = b.actual - parseFloat(b.budgetedAmount);
              const over = b.categoryType === "expense" ? variance > 0 : variance < 0;
              return (
                <tr key={b.id}>
                  <td className="font-medium">{b.categoryName ?? "Uncategorized"}</td>
                  <td>
                    {formatDate(b.periodStart)} – {formatDate(b.periodEnd)}
                  </td>
                  <td>{formatMoney(b.budgetedAmount)}</td>
                  <td>{formatMoney(b.actual)}</td>
                  <td className={over ? "text-[--color-danger]" : "text-[--color-primary]"}>
                    {formatMoney(variance)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
