"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export function OrderItemsEditor({
  products,
}: {
  products: { id: string; name: string; price: string }[];
}) {
  const [rows, setRows] = useState<number[]>([0]);

  return (
    <div>
      <label className="kf-label">Order Items</label>
      <div className="space-y-2">
        {rows.map((rowKey) => (
          <div key={rowKey} className="flex gap-2 items-center">
            <select
              name="productId"
              className="kf-input flex-1"
              required
              onChange={(e) => {
                const form = e.currentTarget.closest("div")!;
                const price = e.currentTarget.selectedOptions[0]?.dataset.price;
                const priceInput = form.querySelector<HTMLInputElement>('input[name="unitPrice"]');
                if (priceInput && price) priceInput.value = price;
              }}
            >
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p.id} value={p.id} data-price={p.price}>
                  {p.name}
                </option>
              ))}
            </select>
            <input type="number" name="quantity" placeholder="Qty" defaultValue={1} min={1} className="kf-input w-20" required />
            <input type="number" step="0.01" name="unitPrice" placeholder="Unit price" className="kf-input w-28" required />
            <button
              type="button"
              onClick={() => setRows((r) => (r.length > 1 ? r.filter((k) => k !== rowKey) : r))}
              className="text-gray-400 hover:text-[--color-danger] shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setRows((r) => [...r, (r.at(-1) ?? 0) + 1])}
        className="kf-btn-secondary mt-2 flex items-center gap-1.5 text-sm"
      >
        <Plus size={14} /> Add Item
      </button>
    </div>
  );
}
