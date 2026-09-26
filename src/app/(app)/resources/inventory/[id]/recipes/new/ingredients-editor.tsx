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
      <div className="space-y-3">
        {rows.map((rowKey) => (
          <div key={rowKey} className="rounded-md border p-3 space-y-2" style={{ borderColor: "var(--color-card-border)" }}>
            <div className="flex gap-2 items-center">
              <select name="ingredientItemId" className="kf-input flex-1" required>
                <option value="">Select ingredient…</option>
                {items.map((it) => (
                  <option key={it.id} value={it.id}>
                    {it.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setRows((r) => (r.length > 1 ? r.filter((k) => k !== rowKey) : r))}
                className="text-gray-400 hover:text-[--color-danger] shrink-0 p-1"
                aria-label="Remove ingredient"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                step="0.01"
                name="ingredientAmount"
                placeholder="Amount"
                inputMode="decimal"
                className="kf-input"
                required
              />
              <input type="text" name="ingredientUnit" placeholder="unit" defaultValue="kilograms" className="kf-input" />
            </div>
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
