"use client";

import { useState } from "react";
import { formatNumber } from "@/lib/format";
import { Wheat } from "lucide-react";

type FeedItem = { id: string; name: string; unit: string; quantityAvailable: string };
type Category = { id: string; name: string };

/** Best-guess income category for a feed item, matched by name — the user
 * can always override it in the dropdown. */
function suggestCategoryId(item: FeedItem | undefined, categories: Category[]): string {
  if (!item) return "";
  const n = item.name.toLowerCase();
  const find = (needle: string) => categories.find((c) => c.name.toLowerCase().includes(needle))?.id;
  if (n.includes("layer")) return find("layers chicken feed sales") ?? "";
  if (n.includes("broiler") || n.includes("fatten")) return find("fattening feed sales") ?? "";
  if (n.includes("milk")) return find("milking cow feed sales") ?? "";
  return "";
}

export function FeedSaleForm({
  action,
  items,
  categories,
}: {
  action: (formData: FormData) => void;
  items: FeedItem[];
  categories: Category[];
}) {
  const [itemId, setItemId] = useState(items[0]?.id ?? "");
  const [categoryId, setCategoryId] = useState(() => suggestCategoryId(items[0], categories));
  const today = new Date().toISOString().slice(0, 10);
  const selected = items.find((i) => i.id === itemId);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="date" value={today} />
      <div>
        <label className="kf-label">Feed Type</label>
        <select
          name="itemId"
          required
          className="kf-input"
          value={itemId}
          onChange={(e) => {
            setItemId(e.target.value);
            setCategoryId(suggestCategoryId(items.find((i) => i.id === e.target.value), categories));
          }}
        >
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} — {formatNumber(item.quantityAvailable)} {item.unit} in stock
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="kf-label">Amount sold ({selected?.unit ?? "kilograms"})</label>
        <input type="number" step="0.01" min="0" inputMode="decimal" name="quantity" required className="kf-input text-lg" />
      </div>
      <div>
        <label className="kf-label">Total amount (ETB)</label>
        <input type="number" step="0.01" min="0" inputMode="decimal" name="amount" required className="kf-input text-lg" />
      </div>
      <div>
        <label className="kf-label">Accounting Category</label>
        <select name="categoryId" className="kf-input" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          <option value="">Uncategorized</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="kf-label">Buyer (optional)</label>
        <input type="text" name="buyer" className="kf-input" placeholder="Walk-in, farm name…" />
      </div>
      <div>
        <label className="kf-label">Payment Method</label>
        <input type="text" name="paymentMethod" className="kf-input" placeholder="Cash, Bank Transfer…" />
      </div>
      <button type="submit" className="kf-btn-primary w-full flex items-center justify-center gap-2 py-2.5">
        <Wheat size={16} /> Save Feed Sale
      </button>
    </form>
  );
}
