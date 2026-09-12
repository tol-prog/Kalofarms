import { pgTable, uuid, text, timestamp, doublePrecision } from "drizzle-orm/pg-core";

// Single-row-ish table holding farm/company profile & settings.
export const farmSettings = pgTable("farm_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  farmName: text("farm_name").notNull().default("Kalo Farm PLC"),
  location: text("location").notNull().default("Holeta, Oromia, Ethiopia"),
  latitude: doublePrecision("latitude").default(9.0667),
  longitude: doublePrecision("longitude").default(38.4833),
  currencyCode: text("currency_code").notNull().default("ETB"),
  currencySymbol: text("currency_symbol").notNull().default("ETB "),
  establishedDate: timestamp("established_date", { withTimezone: true }),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

// Cached weather snapshot so the dashboard doesn't hit the weather API on
// every render. Refreshed periodically by a server action / cron.
export const weatherSnapshots = pgTable("weather_snapshots", {
  id: uuid("id").primaryKey().defaultRandom(),
  fetchedAt: timestamp("fetched_at", { withTimezone: true }).notNull().defaultNow(),
  raw: text("raw").notNull(), // JSON blob from the weather provider
});

export type FarmSettings = typeof farmSettings.$inferSelect;
