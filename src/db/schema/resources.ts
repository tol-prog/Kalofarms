import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  date,
  pgEnum,
} from "drizzle-orm/pg-core";

// --- Equipment -------------------------------------------------------

export const equipmentStatusEnum = pgEnum("equipment_status", [
  "operational",
  "needs_service",
  "out_of_service",
  "sold",
]);

export const equipment = pgTable("equipment", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  type: text("type"),
  make: text("make"),
  model: text("model"),
  purchaseDate: date("purchase_date"),
  purchasePrice: numeric("purchase_price", { precision: 14, scale: 2 }),
  status: equipmentStatusEnum("status").notNull().default("operational"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const equipmentMaintenance = pgTable("equipment_maintenance", {
  id: uuid("id").primaryKey().defaultRandom(),
  equipmentId: uuid("equipment_id")
    .notNull()
    .references(() => equipment.id, { onDelete: "cascade" }),
  date: date("date").notNull(),
  description: text("description").notNull(),
  cost: numeric("cost", { precision: 14, scale: 2 }),
  performedBy: text("performed_by"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Warehouses & Inventory -------------------------------------------

export const warehouses = pgTable("warehouses", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  location: text("location"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryItems = pgTable("inventory_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  variety: text("variety"),
  category: text("category"),
  unit: text("unit").notNull().default("kilograms"),
  quantityAvailable: numeric("quantity_available", { precision: 14, scale: 2 })
    .notNull()
    .default("0"),
  estValuePerUnit: numeric("est_value_per_unit", { precision: 14, scale: 2 }),
  reorderThreshold: numeric("reorder_threshold", { precision: 14, scale: 2 }),
  avgDailyUsage: numeric("avg_daily_usage", { precision: 14, scale: 2 }),
  warehouseId: uuid("warehouse_id").references(() => warehouses.id, {
    onDelete: "set null",
  }),
  archived: text("archived").default("false"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryTransactionTypeEnum = pgEnum("inventory_transaction_type", [
  "add",
  "remove",
  "adjust",
  "recipe_consume",
  "recipe_produce",
  "feeding_consume",
]);

export const inventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  itemId: uuid("item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  date: timestamp("date", { withTimezone: true }).notNull().defaultNow(),
  type: inventoryTransactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  resultingQuantity: numeric("resulting_quantity", { precision: 14, scale: 2 }),
  notes: text("notes"),
  createdByUserId: uuid("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// --- Recipes (feed mixing etc.) ----------------------------------------

export const inventoryRecipes = pgTable("inventory_recipes", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  producesItemId: uuid("produces_item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "cascade" }),
  recipeMakesAmount: numeric("recipe_makes_amount", { precision: 14, scale: 2 })
    .notNull()
    .default("1"),
  recipeMakesUnit: text("recipe_makes_unit").notNull().default("kilograms"),
  instructions: text("instructions"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const inventoryRecipeIngredients = pgTable("inventory_recipe_ingredients", {
  id: uuid("id").primaryKey().defaultRandom(),
  recipeId: uuid("recipe_id")
    .notNull()
    .references(() => inventoryRecipes.id, { onDelete: "cascade" }),
  ingredientItemId: uuid("ingredient_item_id")
    .notNull()
    .references(() => inventoryItems.id, { onDelete: "restrict" }),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  unit: text("unit").notNull().default("kilograms"),
});

export type Equipment = typeof equipment.$inferSelect;
export type Warehouse = typeof warehouses.$inferSelect;
export type InventoryItem = typeof inventoryItems.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type InventoryRecipe = typeof inventoryRecipes.$inferSelect;
export type InventoryRecipeIngredient = typeof inventoryRecipeIngredients.$inferSelect;
