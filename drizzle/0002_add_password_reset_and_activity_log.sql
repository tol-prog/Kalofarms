CREATE TABLE "activity_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"user_name" text NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "must_change_password" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
-- Eggs are now tracked and harvested as a piece count (regular + oversized),
-- not a weight — the original Farmbrite import defaulted every inventory
-- item's unit to "kilograms" including this one. Fix the unit without
-- touching the on-hand quantity, so the number itself is unaffected.
UPDATE "inventory_items" SET "unit" = 'units' WHERE lower("name") = 'eggs' AND "unit" = 'kilograms';