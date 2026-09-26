"use client";

import { useState } from "react";
import { Plus, X, Search } from "lucide-react";

type Item = { id: string; name: string; unit: string };

/** A single ingredient row: a search-as-you-type combobox rather than a
 * plain <select>, since the ingredient list can be long. The text input
 * shows the selected ingredient's name once picked; clicking/focusing it
 * reopens the dropdown so the user can search again to change their pick.
 * The actual selected id travels in a hidden field so the server action
 * keeps reading `ingredientItemId` exactly as before. */
function IngredientRow({
  items,
  onRemove,
  showRemove,
}: {
  items: Item[];
  onRemove: () => void;
  showRemove: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Item | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = query
    ? items.filter((it) => it.name.toLowerCase().includes(query.toLowerCase()))
    : items;

  return (
    <div className="rounded-md border p-3 space-y-2" style={{ borderColor: "var(--color-card-border)" }}>
      <div className="flex gap-2 items-center">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={open ? query : selected?.name ?? ""}
            onFocus={() => {
              setOpen(true);
              setQuery("");
            }}
            onChange={(e) => {
              setQuery(e.target.value);
              if (selected) setSelected(null);
            }}
            onBlur={() => setOpen(false)}
            placeholder="Click to search ingredients…"
            className="kf-input pl-8"
            autoComplete="off"
          />
          {open && (
            <ul
              className="absolute z-10 left-0 right-0 mt-1 max-h-56 overflow-y-auto rounded-md border shadow-sm bg-white text-sm"
              style={{ borderColor: "var(--color-card-border)" }}
            >
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-gray-400">No match</li>
              ) : (
                filtered.map((it) => (
                  <li
                    key={it.id}
                    // onMouseDown (not onClick) fires before the input's
                    // onBlur closes the dropdown, so the pick registers.
                    onMouseDown={() => {
                      setSelected(it);
                      setQuery("");
                      setOpen(false);
                    }}
                    className="px-3 py-2 cursor-pointer hover:bg-[--color-table-row-hover]"
                  >
                    {it.name}
                  </li>
                ))
              )}
            </ul>
          )}
          <input type="hidden" name="ingredientItemId" value={selected?.id ?? ""} required />
        </div>
        {showRemove && (
          <button type="button" onClick={onRemove} className="text-gray-400 hover:text-[--color-danger] shrink-0 p-1" aria-label="Remove ingredient">
            <X size={16} />
          </button>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" step="0.01" name="ingredientAmount" placeholder="Amount" inputMode="decimal" className="kf-input" required />
        <input type="text" name="ingredientUnit" placeholder="unit" defaultValue="kilograms" className="kf-input" />
      </div>
    </div>
  );
}

export function IngredientsEditor({ items }: { items: Item[] }) {
  const [rows, setRows] = useState<number[]>([0]);

  return (
    <div>
      <label className="kf-label">Ingredients</label>
      <div className="space-y-3">
        {rows.map((rowKey) => (
          <IngredientRow
            key={rowKey}
            items={items}
            showRemove={rows.length > 1}
            onRemove={() => setRows((r) => r.filter((k) => k !== rowKey))}
          />
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
