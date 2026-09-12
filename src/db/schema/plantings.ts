import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

export const plantingStatusEnum = pgEnum("planting_status", [
  "planned",
  "planted",
  "growing",
  "harvested",
  "failed",
]);

export const cropTypes = pgTable("crop_types", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  category: text("category"), // e.g. Grain, Forage, Vegetable
  isPerennial: text("is_perennial"),
  notes: text("notes"),
});

export const plantings = pgTable("plantings", {
  id: uuid("id").primaryKey().defaultRandom(),
  cropTypeId: uuid("crop_type_id").references(() => cropTypes.id, {
    onDelete: "set null",
  }),
  fieldLocation: text("field_location"),
  areaSize: numeric("area_size", { precision: 12, scale: 2 }),
  areaUnit: text("area_unit").default("hectares"),
  status: plantingStatusEnum("status").notNull().default("planned"),
  plantedDate: date("planted_date"),
  expectedHarvestDate: date("expected_harvest_date"),
  actualHarvestDate: date("actual_harvest_date"),
  expectedYield: numeric("expected_yield", { precision: 12, scale: 2 }),
  actualYield: numeric("actual_yield", { precision: 12, scale: 2 }),
  yieldUnit: text("yield_unit"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const plantingActivityTypeEnum = pgEnum("planting_activity_type", [
  "input",
  "treatment",
  "irrigation",
  "harvest",
  "soil_test",
  "note",
]);

export const plantingActivity = pgTable("planting_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  plantingId: uuid("planting_id")
    .notNull()
    .references(() => plantings.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: plantingActivityTypeEnum("type").notNull(),
  inputInventoryItemId: uuid("input_inventory_item_id"),
  amount: numeric("amount", { precision: 12, scale: 2 }),
  unit: text("unit"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type CropType = typeof cropTypes.$inferSelect;
export type Planting = typeof plantings.$inferSelect;
export type PlantingActivity = typeof plantingActivity.$inferSelect;
