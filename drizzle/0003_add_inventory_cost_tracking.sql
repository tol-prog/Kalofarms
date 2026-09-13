ALTER TABLE "inventory_items" ADD COLUMN "avg_unit_cost" numeric(14, 4);--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "unit_cost" numeric(14, 4);