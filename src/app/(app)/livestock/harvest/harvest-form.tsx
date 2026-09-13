"use client";

import { StepperInput } from "@/components/ui/stepper-input";
import { formatNumber } from "@/lib/format";

type Batch = { id: string; nameOrLabel: string; numberInSet: number };

export function HarvestForm({
  action,
  batches,
  defaultBatchId,
}: {
  action: (formData: FormData) => void;
  batches: Batch[];
  defaultBatchId: string | null;
}) {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="kf-label">Batch</label>
        <select name="livestockId" required className="kf-input" defaultValue={defaultBatchId ?? batches[0]?.id ?? ""}>
          {batches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.nameOrLabel} ({formatNumber(b.numberInSet)} birds)
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="kf-label">Date</label>
        <input type="date" name="date" className="kf-input" defaultValue={today} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StepperInput name="regularEggs" label="Regular eggs" defaultValue={0} />
        <StepperInput name="oversizedEggs" label="Oversized eggs" defaultValue={0} />
        <StepperInput name="brokenEggs" label="Broken / cracked" defaultValue={0} danger />
      </div>

      <div>
        <label className="kf-label">Notes</label>
        <textarea name="notes" className="kf-input" rows={2} />
      </div>

      <button type="submit" className="kf-btn-primary w-full py-2.5">
        Save Harvest
      </button>
    </form>
  );
}
