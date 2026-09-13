"use client";

import { useState } from "react";
import { StepperInput } from "@/components/ui/stepper-input";

type ActivityType =
  | "note"
  | "change_count"
  | "harvest"
  | "weight"
  | "feeding"
  | "treatment"
  | "wellness"
  | "birth";

export function RecordActivityForm({
  action,
  defaultType = "note",
}: {
  action: (formData: FormData) => void;
  defaultType?: ActivityType;
}) {
  const [type, setType] = useState<ActivityType>(defaultType);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="kf-label">Type</label>
          <select
            name="type"
            className="kf-input"
            value={type}
            onChange={(e) => setType(e.target.value as ActivityType)}
          >
            <option value="note">Note</option>
            <option value="change_count">Mortality / Change Count</option>
            <option value="harvest">Harvest (eggs / milk / meat)</option>
            <option value="weight">Weigh-in</option>
            <option value="feeding">Feeding</option>
            <option value="treatment">Treatment / Vaccine</option>
            <option value="wellness">Wellness Check</option>
            <option value="birth">Birth</option>
          </select>
        </div>
        <div>
          <label className="kf-label">Date</label>
          <input type="date" name="date" className="kf-input" defaultValue={today} />
        </div>
      </div>

      {type === "harvest" && (
        <div className="kf-card p-4" style={{ background: "var(--color-badge-muted-bg)", border: "none" }}>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Egg Harvest (leave at 0 if not applicable)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <StepperInput name="regularEggs" label="Regular eggs" defaultValue={0} />
            <StepperInput name="oversizedEggs" label="Oversized eggs" defaultValue={0} />
            <StepperInput name="brokenEggs" label="Broken / cracked" defaultValue={0} danger />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Or milk / meat / other yield
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="kf-label">Yield Amount</label>
              <input type="number" step="0.01" name="yieldAmount" className="kf-input" />
            </div>
            <div>
              <label className="kf-label">Yield Unit</label>
              <input type="text" name="yieldUnit" placeholder="liters, kg" className="kf-input" />
            </div>
          </div>
        </div>
      )}

      {type === "change_count" && (
        <div className="grid grid-cols-2 gap-3">
          <StepperInput name="deceasedCount" label="Deceased Count" defaultValue={0} />
          <div>
            <label className="kf-label">New Set Count (override)</label>
            <input type="number" name="newSetCount" min={0} className="kf-input" />
          </div>
        </div>
      )}

      {type === "treatment" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="kf-label">Treatment / Vaccine Name</label>
            <input type="text" name="treatmentName" className="kf-input" placeholder="e.g. Newcastle vaccine" />
          </div>
          <div>
            <label className="kf-label">Withdrawal Period Ends</label>
            <input type="date" name="withdrawalUntil" className="kf-input" />
          </div>
        </div>
      )}

      {type === "weight" && (
        <div>
          <label className="kf-label">Weight (kg)</label>
          <input type="number" step="0.01" name="weight" className="kf-input max-w-xs" />
        </div>
      )}

      {type === "feeding" && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="kf-label">Feed Amount</label>
            <input type="number" step="0.01" name="feedAmount" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Feed Unit</label>
            <input type="text" name="feedUnit" placeholder="kg" className="kf-input" defaultValue="kg" />
          </div>
        </div>
      )}

      <div>
        <label className="kf-label">Notes</label>
        <textarea name="notes" className="kf-input" rows={2} />
      </div>
      <div className="flex justify-end">
        <button type="submit" className="kf-btn-primary">
          Save Activity
        </button>
      </div>
    </form>
  );
}
