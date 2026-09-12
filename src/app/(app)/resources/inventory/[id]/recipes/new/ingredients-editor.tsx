"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";

export function IngredientsEditor({
  items,
}: {
  items: { id: string; name: string; unit: string }[];
}) {
  const [rows, setRows] = useState<number[]>([0]);

  return (
    <div>
      <label className="kf-label">Ingredients</label>
      <div className="space-y-2">
        {rows.map((rowKey) => (
          <div key={rowKey} className="flex gap-2 items-center">
            <select name="ingredientItemId" className="kf-input flex-1" required>
              <option value="">Select ingredient…</option>
              {items.map((it) => (
                <option key={it.id} value={it.id}>
                  {it.name}
                </option>
              ))}
            </select>
            <input
              type="number"
              step="0.01"
              name="ingredientAmount"
              placeholder="Amount"
              className="kf-input w-28"
              required
            />
            <input type="text" name="ingredientUnit" placeholder="unit" defaultValue="kilograms" className="kf-input w-28" />
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
        <Plus size={14} /> Add Ingredient
      </button>
    </div>
  );
}
