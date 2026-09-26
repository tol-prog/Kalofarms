"use client";

import { useState } from "react";
import { Plus, X, Search } from "lucide-react";

export function IngredientsEditor({
  items,
}: {
  items: { id: string; name: string; unit: string }[];
}) {
  const [rows, setRows] = useState<number[]>([0]);
  // Per-row search text that filters the ingredient dropdown's options —
  // cleared after a pick so the full list is back for the next ingredient.
  const [queries, setQueries] = useState<Record<number, string>>({});

  return (
    <div>
      <label className="kf-label">Ingredients</label>
      <div className="space-y-3">
        {rows.map((rowKey) => {
          const query = queries[rowKey] ?? "";
          const filtered = query
            ? items.filter((it) => it.name.toLowerCase().includes(query.toLowerCase()))
            : items;
          return (
            <div key={rowKey} className="rounded-md border p-3 space-y-2" style={{ borderColor: "var(--color-card-border)" }}>
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQueries((q) => ({ ...q, [rowKey]: e.target.value }))}
                  placeholder="Search ingredient…"
                  className="kf-input pl-8 text-sm"
                />
              </div>
              <div className="flex gap-2 items-center">
                <select
                  name="ingredientItemId"
                  className="kf-input flex-1"
                  required
                  onChange={() => setQueries((q) => ({ ...q, [rowKey]: "" }))}
                >
                  <option value="">
                    {filtered.length === 0 ? "No match — clear search" : "Select ingredient…"}
                  </option>
                  {filtered.map((it) => (
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
          );
        })}
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
