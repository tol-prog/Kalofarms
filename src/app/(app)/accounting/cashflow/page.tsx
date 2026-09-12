import { db, schema } from "@/db";
import { sql } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatMoney } from "@/lib/format";
import { IncomeExpenseChart, type MonthlyPoint } from "../../dashboard/income-expense-chart";

export const dynamic = "force-dynamic";

export default async function CashFlowPage() {
  const rows = await db
    .select({
      month: sql<string>`to_char(${schema.transactions.date}, 'Mon YYYY')`,
      monthKey: sql<string>`to_char(${schema.transactions.date}, 'YYYY-MM')`,
      type: schema.transactions.type,
      amount: schema.transactions.amount,
    })
    .from(schema.transactions);

  const buckets = new Map<string, MonthlyPoint>();
  for (const r of rows) {
    if (!buckets.has(r.monthKey)) buckets.set(r.monthKey, { month: r.month, income: 0, expense: 0, net: 0 });
    const b = buckets.get(r.monthKey)!;
    const amt = parseFloat(r.amount);
    if (r.type === "income") b.income += amt;
    else if (r.type === "expense") b.expense += amt;
  }
  const sortedKeys = Array.from(buckets.keys()).sort();

  let running = 0;
  const monthlyData = sortedKeys.map((k) => {
    const b = buckets.get(k)!;
    const net = b.income - b.expense;
    running += net;
    return { ...b, net, expense: -b.expense, runningBalance: running };
  });

  const chartData: MonthlyPoint[] = monthlyData.map(({ month, income, expense, net }) => ({ month, income, expense, net }));

  return (
    <div>
      <PageHeader title="Cash Flow" description="Monthly cash movement" />

      <div className="kf-card p-5 mb-5">
        {chartData.length === 0 ? (
          <p className="text-sm text-gray-400 py-10 text-center">No transactions recorded yet.</p>
        ) : (
          <IncomeExpenseChart data={chartData} />
        )}
      </div>

      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Month</th>
              <th>Income</th>
              <th>Expense</th>
              <th>Net</th>
              <th>Running Balance</th>
            </tr>
          </thead>
          <tbody>
            {monthlyData.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  No data yet.
                </td>
              </tr>
            )}
            {monthlyData.map((m) => (
              <tr key={m.month}>
                <td className="font-medium">{m.month}</td>
                <td className="text-[--color-primary]">{formatMoney(m.income)}</td>
                <td className="text-[--color-danger]">{formatMoney(Math.abs(m.expense))}</td>
                <td>{formatMoney(m.net)}</td>
                <td className="font-semibold">{formatMoney(m.runningBalance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
