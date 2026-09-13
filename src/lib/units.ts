/**
 * Minimal weight-unit conversion for recipe costing. All of the farm's real
 * feed recipes are denominated in kilograms; quintals (100 kg — the standard
 * Ethiopian bulk unit) is the other one actually used for inventory. Any
 * other unit (liters, bales, units) isn't a weight, so it's treated as
 * already "kg-equivalent" — fine for this farm's data, but not a general
 * unit converter.
 */
const KG_PER_UNIT: Record<string, number> = {
  kilograms: 1,
  quintals: 100,
};

export function toKg(amount: number, unit: string): number {
  const factor = KG_PER_UNIT[unit.toLowerCase()];
  return factor ? amount * factor : amount;
}

/** Cost per kilogram, given a cost quoted per `unit`. */
export function costPerKg(unitCost: number, unit: string): number {
  const factor = KG_PER_UNIT[unit.toLowerCase()];
  return factor ? unitCost / factor : unitCost;
}

export const KG_PER_QUINTAL = 100;
