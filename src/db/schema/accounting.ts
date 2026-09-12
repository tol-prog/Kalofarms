import {
  pgTable,
  uuid,
  text,
  timestamp,
  numeric,
  pgEnum,
  date,
} from "drizzle-orm/pg-core";

export const accountingCategoryTypeEnum = pgEnum("accounting_category_type", [
  "income",
  "expense",
]);

export const accountingCategories = pgTable("accounting_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  type: accountingCategoryTypeEnum("type").notNull(),
  taxLine: text("tax_line"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const transactionTypeEnum = pgEnum("transaction_type", [
  "income",
  "expense",
  "transfer",
]);

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  date: date("date").notNull(),
  categoryId: uuid("category_id").references(() => accountingCategories.id, {
    onDelete: "set null",
  }),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 14, scale: 2 }).notNull(),
  description: text("description"),
  paymentMethod: text("payment_method"),
  contactId: uuid("contact_id"),
  relatedLivestockId: uuid("related_livestock_id"),
  relatedInventoryItemId: uuid("related_inventory_item_id"),
  attachmentUrl: text("attachment_url"),
  createdByUserId: uuid("created_by_user_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => accountingCategories.id, { onDelete: "cascade" }),
  periodStart: date("period_start").notNull(),
  periodEnd: date("period_end").notNull(),
  budgetedAmount: numeric("budgeted_amount", { precision: 14, scale: 2 }).notNull(),
  notes: text("notes"),
});

export type AccountingCategory = typeof accountingCategories.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
