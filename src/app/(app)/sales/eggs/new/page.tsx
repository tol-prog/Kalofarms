import { db, schema } from "@/db";
import { ilike } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatNumber } from "@/lib/format";
import { logEggSale } from "@/lib/actions/sales-actions";
import { Egg } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EggSalePage() {
  const [eggItem] = await db.select().from(schema.inventoryItems).where(ilike(schema.inventoryItems.name, "Eggs")).limit(1);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-xl">
      <PageHeader
        title="Egg Sale"
        description={eggItem ? `${formatNumber(eggItem.quantityAvailable)} eggs currently in stock` : undefined}
      />
      <form action={logEggSale} className="kf-card p-5 space-y-4">
        <input type="hidden" name="date" value={today} />
        <div>
          <label className="kf-label">Eggs sold</label>
          <input
            type="number"
            step="1"
            min="0"
            inputMode="numeric"
            name="quantity"
            required
            className="kf-input text-lg"
            placeholder="0"
          />
        </div>
        <div>
          <label className="kf-label">Total amount (ETB)</label>
          <input type="number" step="0.01" min="0" inputMode="decimal" name="amount" required className="kf-input text-lg" />
        </div>
        <div>
          <label className="kf-label">Buyer (optional)</label>
          <input type="text" name="buyer" className="kf-input" placeholder="Walk-in, shop name…" />
        </div>
        <div>
          <label className="kf-label">Payment Method</label>
          <input type="text" name="paymentMethod" className="kf-input" placeholder="Cash, Bank Transfer…" />
        </div>
        <button type="submit" className="kf-btn-primary w-full flex items-center justify-center gap-2 py-2.5">
          <Egg size={16} /> Save Egg Sale
        </button>
      </form>
    </div>
  );
}
