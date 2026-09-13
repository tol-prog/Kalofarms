import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  numeric,
  pgEnum,
  date,
  jsonb,
  boolean,
} from "drizzle-orm/pg-core";

export const livestockStatusEnum = pgEnum("livestock_status", [
  "active",
  "sold",
  "deceased",
  "archived",
]);

export const methodAcquiredEnum = pgEnum("method_acquired", [
  "purchased",
  "born_on_farm",
  "gifted",
  "other",
]);

// A "livestock" record can represent a single animal OR a counted set
// (e.g. "Layer Chicken" with numberInSet = 6026), mirroring Farmbrite.
export const livestock = pgTable("livestock", {
  id: uuid("id").primaryKey().defaultRandom(),
  nameOrLabel: text("name_or_label").notNull(),
  internalId: text("internal_id"),
  animalType: text("animal_type").notNull(), // Chicken, Cattle, Sheep, etc.
  breed: text("breed"),
  coloring: text("coloring"),
  tagNumber: text("tag_number"),
  keywords: text("keywords").array(),
  gender: text("gender"),
  numberInSet: integer("number_in_set").notNull().default(1),
  status: livestockStatusEnum("status").notNull().default("active"),
  locationPaddock: text("location_paddock"),
  methodAcquired: methodAcquiredEnum("method_acquired"),
  purchaseDate: date("purchase_date"),
  birthDate: date("birth_date"),
  estimatedBreakEven: numeric("estimated_break_even", { precision: 14, scale: 2 }),
  lastWeight: numeric("last_weight", { precision: 10, scale: 2 }),
  wellnessScore: integer("wellness_score"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const livestockGroupTypeEnum = pgEnum("livestock_group_type", [
  "set",
  "smart",
]);

export const livestockGroups = pgTable("livestock_groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: livestockGroupTypeEnum("type").notNull().default("set"),
  smartCriteria: jsonb("smart_criteria"), // for "smart" groups: filter rules
  archived: boolean("archived").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const livestockGroupMembers = pgTable("livestock_group_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupId: uuid("group_id")
    .notNull()
    .references(() => livestockGroups.id, { onDelete: "cascade" }),
  livestockId: uuid("livestock_id")
    .notNull()
    .references(() => livestock.id, { onDelete: "cascade" }),
});

export const livestockActivityTypeEnum = pgEnum("livestock_activity_type", [
  "change_count",
  "harvest",
  "weight",
  "treatment",
  "feeding",
  "wellness",
  "birth",
  "note",
]);

// Timeline of everything that happens to an animal/set: deceased counts,
// harvest yields (eggs/milk/meat), feedings, treatments, weigh-ins, notes.
export const livestockActivity = pgTable("livestock_activity", {
  id: uuid("id").primaryKey().defaultRandom(),
  livestockId: uuid("livestock_id")
    .notNull()
    .references(() => livestock.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  type: livestockActivityTypeEnum("type").notNull(),
  deceasedCount: integer("deceased_count"),
  newSetCount: integer("new_set_count"),
  yieldAmount: numeric("yield_amount", { precision: 12, scale: 2 }),
  yieldUnit: text("yield_unit"),
  // Egg-quality breakdown for poultry harvests (Farmbrite-style). When these
  // are filled in, yieldAmount/yieldUnit above are derived as their sum + "eggs".
  regularEggs: integer("regular_eggs"),
  oversizedEggs: integer("oversized_eggs"),
  brokenEggs: integer("broken_eggs"),
  feedInventoryItemId: uuid("feed_inventory_item_id"),
  feedAmount: numeric("feed_amount", { precision: 12, scale: 2 }),
  feedUnit: text("feed_unit"),
  weight: numeric("weight", { precision: 10, scale: 2 }),
  treatmentName: text("treatment_name"),
  withdrawalUntil: date("withdrawal_until"),
  notes: text("notes"),
  createdByUserId: uuid("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const grazingRecords = pgTable("grazing_records", {
  id: uuid("id").primaryKey().defaultRandom(),
  paddockName: text("paddock_name").notNull(),
  livestockGroupId: uuid("livestock_group_id").references(() => livestockGroups.id, {
    onDelete: "set null",
  }),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type Livestock = typeof livestock.$inferSelect;
export type NewLivestock = typeof livestock.$inferInsert;
export type LivestockGroup = typeof livestockGroups.$inferSelect;
export type LivestockActivity = typeof livestockActivity.$inferSelect;
export type GrazingRecord = typeof grazingRecords.$inferSelect;
