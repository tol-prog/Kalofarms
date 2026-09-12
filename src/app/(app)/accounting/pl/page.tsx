import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ProfitAndLossPage() {
  const rows = await db
    .select({
      categoryId: schema.transactions.categoryId,
      categoryName: schema.accountingCategories.name,
      type: schema.transactions.type,
      amount: schema.transactions.amount,
    })
    .from(schema.transactions)
    .leftJoin(schema.accountingCategories, eq(schema.accountingCategories.id, schema.transactions.categoryId));

  const incomeByCategory = new Map<string, number>();
  const expenseByCategory = new Map<string, number>();

  for (const r of rows) {
    const name = r.categoryName ?? "Uncategorized";
    const amt = parseFloat(r.amount);
    if (r.type === "income") incomeByCategory.set(name, (incomeByCategory.get(name) ?? 0) + amt);
    else if (r.type === "expense") expenseByCategory.set(name, (expenseByCategory.get(name) ?? 0) + amt);
  }

  const totalIncome = Array.from(incomeByCategory.values()).reduce((a, b) => a + b, 0);
  const totalExpense = Array.from(expenseByCategory.values()).reduce((a, b) => a + b, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <div>
      <PageHeader title="Profit &amp; Loss Statement" description="All-time, cash basis" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        <StatementCard title="Income" rows={incomeByCategory} total={totalIncome} tone="positive" />
        <StatementCard title="Expenses" rows={expenseByCategory} total={totalExpense} tone="negative" />
      </div>

      <div className="kf-card p-5 flex items-center justify-between">
        <p className="font-semibold">Net Profit</p>
        <p className={`text-xl font-semibold ${netProfit >= 0 ? "text-[--color-primary]" : "text-[--color-danger]"}`}>
          {formatMoney(netProfit)}
        </p>
      </div>
    </div>
  );
}

function StatementCard({
  title,
  rows,
  total,
  tone,
}: {
  title: string;
  rows: Map<string, number>;
  total: number;
  tone: "positive" | "negative";
}) {
  const sorted = Array.from(rows.entries()).sort((a, b) => b[1] - a[1]);
  return (
    <div className="kf-card p-5">
      <h2 className="text-sm font-semibold mb-3">{title}</h2>
      {sorted.length === 0 ? (
        <p className="text-sm text-gray-400">No {title.toLowerCase()} recorded.</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {sorted.map(([name, amt]) => (
            <li key={name} className="flex justify-between">
              <span className="text-gray-600">{name}</span>
              <span className="font-medium">{formatMoney(amt)}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="flex justify-between mt-3 pt-3 border-t font-semibold" style={{ borderColor: "var(--color-card-border)" }}>
        <span>Total {title}</span>
        <span className={tone === "positive" ? "text-[--color-primary]" : "text-[--color-danger]"}>
          {formatMoney(total)}
        </span>
      </div>
    </div>
  );
}
