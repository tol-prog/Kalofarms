"use client";

import type { Livestock } from "@/db/schema";

const ANIMAL_TYPES = ["Chicken", "Cattle", "Sheep", "Goat", "Pig", "Horse", "Other"];

export function AnimalForm({
  animal,
  action,
}: {
  animal?: Livestock;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="kf-card p-6 max-w-3xl space-y-6">
      <section>
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Basic Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Name or Label" name="nameOrLabel" defaultValue={animal?.nameOrLabel} required />
          <Field label="Internal ID" name="internalId" defaultValue={animal?.internalId ?? undefined} />
          <div>
            <label className="kf-label">Animal Type</label>
            <select name="animalType" defaultValue={animal?.animalType ?? "Chicken"} className="kf-input">
              {ANIMAL_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <Field label="Breed" name="breed" defaultValue={animal?.breed ?? undefined} />
          <Field label="Tag Number" name="tagNumber" defaultValue={animal?.tagNumber ?? undefined} />
          <div>
            <label className="kf-label">Gender</label>
            <select name="gender" defaultValue={animal?.gender ?? ""} className="kf-input">
              <option value="">Not specified</option>
              <option value="Female">Female</option>
              <option value="Male">Male</option>
            </select>
          </div>
          <Field
            label="Number in Set"
            name="numberInSet"
            type="number"
            min={1}
            defaultValue={animal?.numberInSet ?? 1}
          />
          <div>
            <label className="kf-label">Status</label>
            <select name="status" defaultValue={animal?.status ?? "active"} className="kf-input">
              <option value="active">Active</option>
              <option value="sold">Sold</option>
              <option value="deceased">Deceased</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <Field label="Location / Paddock" name="locationPaddock" defaultValue={animal?.locationPaddock ?? undefined} />
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold mb-3 text-gray-700">Birth &amp; Acquisition</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Method Acquired</label>
            <select name="methodAcquired" defaultValue={animal?.methodAcquired ?? ""} className="kf-input">
              <option value="">Not specified</option>
              <option value="purchased">Purchased</option>
              <option value="born_on_farm">Born on Farm</option>
              <option value="gifted">Gifted</option>
              <option value="other">Other</option>
            </select>
          </div>
          <Field label="Purchase Date" name="purchaseDate" type="date" defaultValue={animal?.purchaseDate ?? undefined} />
          <Field label="Birth Date" name="birthDate" type="date" defaultValue={animal?.birthDate ?? undefined} />
          <Field
            label="Estimated Break-Even (ETB)"
            name="estimatedBreakEven"
            type="number"
            step="0.01"
            defaultValue={animal?.estimatedBreakEven ?? undefined}
          />
        </div>
      </section>

      <section>
        <label className="kf-label">Notes</label>
        <textarea name="notes" defaultValue={animal?.notes ?? undefined} className="kf-input" rows={3} />
      </section>

      <div className="flex justify-end gap-2">
        <button type="submit" className="kf-btn-primary">
          {animal ? "Save Changes" : "Create Animal"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  defaultValue,
  type = "text",
  required,
  min,
  step,
}: {
  label: string;
  name: string;
  defaultValue?: string | number;
  type?: string;
  required?: boolean;
  min?: number;
  step?: string;
}) {
  return (
    <div>
      <label className="kf-label" htmlFor={name}>
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        defaultValue={defaultValue as string}
        required={required}
        min={min}
        step={step}
        className="kf-input"
      />
    </div>
  );
}
