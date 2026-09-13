"use client";

import { Minus, Plus } from "lucide-react";
import { useId, useState } from "react";

/**
 * A numeric field with +/- buttons AND a directly-editable number input,
 * for fast tally entry (egg counts, mortality, etc.) on mobile.
 */
export function StepperInput({
  name,
  defaultValue = 0,
  step = 1,
  min = 0,
  label,
  danger = false,
}: {
  name: string;
  defaultValue?: number;
  step?: number;
  min?: number;
  label?: string;
  danger?: boolean;
}) {
  const [value, setValue] = useState(defaultValue);
  const id = useId();

  function clamp(n: number) {
    return Number.isFinite(n) ? Math.max(n, min) : min;
  }

  return (
    <div>
      {label && (
        <label htmlFor={id} className="kf-label">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Decrease"
          onClick={() => setValue((v) => clamp(v - step))}
          className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center border"
          style={{ borderColor: "var(--color-card-border)", background: "var(--color-badge-muted-bg)" }}
        >
          <Minus size={15} />
        </button>
        <input
          id={id}
          type="number"
          name={name}
          value={value}
          step={step}
          min={min}
          onChange={(e) => setValue(clamp(e.target.valueAsNumber))}
          className="kf-input text-center font-semibold"
          style={danger && value > 0 ? { color: "var(--color-danger)" } : undefined}
        />
        <button
          type="button"
          aria-label="Increase"
          onClick={() => setValue((v) => clamp(v + step))}
          className="shrink-0 w-9 h-9 rounded-md flex items-center justify-center text-white"
          style={{ background: "var(--color-primary)" }}
        >
          <Plus size={15} />
        </button>
      </div>
    </div>
  );
}
