import { db, schema } from "@/db";
import { PageHeader } from "@/components/ui/page-header";
import { formatMoney, formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const [livestock, activity, inventoryItems, transactions] = await Promise.all([
    db.select().from(schema.livestock),
    db.select().from(schema.livestockActivity),
    db.select().from(schema.inventoryItems),
    db.select().from(schema.transactions),
  ]);

  // Livestock summary by animal type
  const byType = new Map<string, { count: number; sets: number }>();
  for (const a of livestock) {
    const t = byType.get(a.animalType) ?? { count: 0, sets: 0 };
    t.count += a.numberInSet;
    t.sets += 1;
    byType.set(a.animalType, t);
  }

  // Mortality report — total deceased by livestock
  const deceasedByLivestock = new Map<string, number>();
  for (const a of activity) {
    if (a.deceasedCount) {
      deceasedByLivestock.set(a.livestockId, (deceasedByLivestock.get(a.livestockId) ?? 0) + a.deceasedCount);
    }
  }
  const totalDeceased = Array.from(deceasedByLivestock.values()).reduce((a, b) => a + b, 0);

  // Inventory valuation
  const totalInventoryValue = inventoryItems.reduce((sum, i) => {
    if (!i.estValuePerUnit) return sum;
    return sum + parseFloat(i.quantityAvailable) * parseFloat(i.estValuePerUnit);
  }, 0);

  // Financial summary
  const totalIncome = transactions.filter((t) => t.type === "income").reduce((s, t) => s + parseFloat(t.amount), 0);
  const totalExpense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + parseFloat(t.amount), 0);

  return (
    <div>
      <PageHeader title="Reports" description="Farm-wide summaries" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        <SummaryCard label="Total Animals" value={formatNumber(livestock.reduce((s, a) => s + a.numberInSet, 0))} />
        <SummaryCard label="Total Deceased" value={formatNumber(totalDeceased)} />
        <SummaryCard label="Inventory Value" value={formatMoney(totalInventoryValue)} />
        <SummaryCard label="Net Profit (All Time)" value={formatMoney(totalIncome - totalExpense)} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="kf-card p-5">
          <h2 className="text-sm font-semibold mb-3">Livestock Summary by Type</h2>
          <table className="w-full kf-table">
            <thead>
              <tr>
                <th>Animal Type</th>
                <th>Records</th>
                <th>Total Head</th>
              </tr>
            </thead>
            <tbody>
              {byType.size === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-6">
                    No livestock data.
                  </td>
                </tr>
              )}
              {Array.from(byType.entries()).map(([type, t]) => (
                <tr key={type}>
                  <td className="font-medium">{type}</td>
                  <td>{t.sets}</td>
                  <td>{formatNumber(t.count)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="kf-card p-5">
          <h2 className="text-sm font-semibold mb-3">Inventory Valuation</h2>
          <table className="w-full kf-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Qty</th>
                <th>Value</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.length === 0 && (
                <tr>
                  <td colSpan={3} className="text-center text-gray-400 py-6">
                    No inventory data.
                  </td>
                </tr>
              )}
              {inventoryItems
                .filter((i) => i.estValuePerUnit)
                .sort(
                  (a, b) =>
                    parseFloat(b.quantityAvailable) * parseFloat(b.estValuePerUnit ?? "0") -
                    parseFloat(a.quantityAvailable) * parseFloat(a.estValuePerUnit ?? "0")
                )
                .slice(0, 10)
                .map((i) => (
                  <tr key={i.id}>
                    <td className="font-medium">{i.name}</td>
                    <td>
                      {formatNumber(i.quantityAvailable)} {i.unit}
                    </td>
                    <td>{formatMoney(parseFloat(i.quantityAvailable) * parseFloat(i.estValuePerUnit ?? "0"))}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="kf-card p-4">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
    </div>
  );
}
