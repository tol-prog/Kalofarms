import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatMoney } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BalanceSheetPage() {
  const [txns, inventoryItems, equipmentRows] = await Promise.all([
    db
      .select({
        type: schema.transactions.type,
        amount: schema.transactions.amount,
        categoryName: schema.accountingCategories.name,
      })
      .from(schema.transactions)
      .leftJoin(schema.accountingCategories, eq(schema.accountingCategories.id, schema.transactions.categoryId)),
    db.select().from(schema.inventoryItems),
    db.select().from(schema.equipment),
  ]);

  let cash = 0;
  let liabilities = 0;
  for (const t of txns) {
    const amt = parseFloat(t.amount);
    const isLiabilityCategory = /loan|payable|borrow/i.test(t.categoryName ?? "");
    if (t.type === "income") {
      cash += amt;
      if (isLiabilityCategory) liabilities += amt;
    } else if (t.type === "expense") {
      cash -= amt;
      if (isLiabilityCategory) liabilities -= amt;
    }
  }

  const inventoryValue = inventoryItems.reduce((sum, item) => {
    if (!item.estValuePerUnit) return sum;
    return sum + parseFloat(item.quantityAvailable) * parseFloat(item.estValuePerUnit);
  }, 0);

  const equipmentValue = equipmentRows.reduce((sum, e) => sum + (e.purchasePrice ? parseFloat(e.purchasePrice) : 0), 0);

  const totalAssets = cash + inventoryValue + equipmentValue;
  const equity = totalAssets - liabilities;

  return (
    <div>
      <PageHeader title="Balance Sheet" description="Simplified — derived from transactions, inventory and equipment records" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="kf-card p-5">
          <h2 className="text-sm font-semibold mb-3">Assets</h2>
          <Row label="Cash & Equivalents" value={cash} />
          <Row label="Inventory Value" value={inventoryValue} />
          <Row label="Equipment Value" value={equipmentValue} />
          <Row label="Total Assets" value={totalAssets} bold />
        </div>

        <div className="space-y-5">
          <div className="kf-card p-5">
            <h2 className="text-sm font-semibold mb-3">Liabilities</h2>
            <Row label="Loans & Payables" value={liabilities} />
            <Row label="Total Liabilities" value={liabilities} bold />
          </div>
          <div className="kf-card p-5">
            <h2 className="text-sm font-semibold mb-3">Equity</h2>
            <Row label="Owner&rsquo;s Equity (Assets − Liabilities)" value={equity} bold />
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div
      className={`flex justify-between py-1.5 text-sm ${bold ? "font-semibold border-t mt-1 pt-2" : "text-gray-600"}`}
      style={bold ? { borderColor: "var(--color-card-border)" } : undefined}
    >
      <span>{label}</span>
      <span>{formatMoney(value)}</span>
    </div>
  );
}
