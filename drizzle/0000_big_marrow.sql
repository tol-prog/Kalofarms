CREATE TYPE "public"."user_role" AS ENUM('admin', 'operations_manager', 'staff');--> statement-breakpoint
CREATE TYPE "public"."accounting_category_type" AS ENUM('income', 'expense');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('income', 'expense', 'transfer');--> statement-breakpoint
CREATE TYPE "public"."livestock_activity_type" AS ENUM('change_count', 'harvest', 'weight', 'treatment', 'feeding', 'wellness', 'birth', 'note');--> statement-breakpoint
CREATE TYPE "public"."livestock_group_type" AS ENUM('set', 'smart');--> statement-breakpoint
CREATE TYPE "public"."livestock_status" AS ENUM('active', 'sold', 'deceased', 'archived');--> statement-breakpoint
CREATE TYPE "public"."method_acquired" AS ENUM('purchased', 'born_on_farm', 'gifted', 'other');--> statement-breakpoint
CREATE TYPE "public"."planting_activity_type" AS ENUM('input', 'treatment', 'irrigation', 'harvest', 'soil_test', 'note');--> statement-breakpoint
CREATE TYPE "public"."planting_status" AS ENUM('planned', 'planted', 'growing', 'harvested', 'failed');--> statement-breakpoint
CREATE TYPE "public"."equipment_status" AS ENUM('operational', 'needs_service', 'out_of_service', 'sold');--> statement-breakpoint
CREATE TYPE "public"."inventory_transaction_type" AS ENUM('add', 'remove', 'adjust', 'recipe_consume', 'recipe_produce', 'feeding_consume');--> statement-breakpoint
CREATE TYPE "public"."contact_type" AS ENUM('customer', 'vendor', 'employee', 'other');--> statement-breakpoint
CREATE TYPE "public"."order_status" AS ENUM('pending', 'confirmed', 'fulfilled', 'cancelled');--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "user_role" DEFAULT 'staff' NOT NULL,
	"avatar_url" text,
	"disabled" boolean DEFAULT false NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "farm_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"farm_name" text DEFAULT 'Kalo Farm PLC' NOT NULL,
	"location" text DEFAULT 'Holeta, Oromia, Ethiopia' NOT NULL,
	"latitude" double precision DEFAULT 9.0667,
	"longitude" double precision DEFAULT 38.4833,
	"currency_code" text DEFAULT 'ETB' NOT NULL,
	"currency_symbol" text DEFAULT 'ETB ' NOT NULL,
	"established_date" timestamp with time zone,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "weather_snapshots" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
	"raw" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "accounting_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"type" "accounting_category_type" NOT NULL,
	"tax_line" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"category_id" uuid NOT NULL,
	"period_start" date NOT NULL,
	"period_end" date NOT NULL,
	"budgeted_amount" numeric(14, 2) NOT NULL,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"date" date NOT NULL,
	"category_id" uuid,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"description" text,
	"payment_method" text,
	"contact_id" uuid,
	"related_livestock_id" uuid,
	"related_inventory_item_id" uuid,
	"attachment_url" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "grazing_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paddock_name" text NOT NULL,
	"livestock_group_id" uuid,
	"start_date" date NOT NULL,
	"end_date" date,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name_or_label" text NOT NULL,
	"internal_id" text,
	"animal_type" text NOT NULL,
	"breed" text,
	"coloring" text,
	"tag_number" text,
	"keywords" text[],
	"gender" text,
	"number_in_set" integer DEFAULT 1 NOT NULL,
	"status" "livestock_status" DEFAULT 'active' NOT NULL,
	"location_paddock" text,
	"method_acquired" "method_acquired",
	"purchase_date" date,
	"birth_date" date,
	"estimated_break_even" numeric(14, 2),
	"last_weight" numeric(10, 2),
	"wellness_score" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"livestock_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" "livestock_activity_type" NOT NULL,
	"deceased_count" integer,
	"new_set_count" integer,
	"yield_amount" numeric(12, 2),
	"yield_unit" text,
	"feed_inventory_item_id" uuid,
	"feed_amount" numeric(12, 2),
	"feed_unit" text,
	"weight" numeric(10, 2),
	"treatment_name" text,
	"withdrawal_until" date,
	"notes" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_group_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"livestock_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "livestock_groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "livestock_group_type" DEFAULT 'set' NOT NULL,
	"smart_criteria" jsonb,
	"archived" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crop_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"category" text,
	"is_perennial" text,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "planting_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"planting_id" uuid NOT NULL,
	"date" date NOT NULL,
	"type" "planting_activity_type" NOT NULL,
	"input_inventory_item_id" uuid,
	"amount" numeric(12, 2),
	"unit" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "plantings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"crop_type_id" uuid,
	"field_location" text,
	"area_size" numeric(12, 2),
	"area_unit" text DEFAULT 'hectares',
	"status" "planting_status" DEFAULT 'planned' NOT NULL,
	"planted_date" date,
	"expected_harvest_date" date,
	"actual_harvest_date" date,
	"expected_yield" numeric(12, 2),
	"actual_yield" numeric(12, 2),
	"yield_unit" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" text,
	"make" text,
	"model" text,
	"purchase_date" date,
	"purchase_price" numeric(14, 2),
	"status" "equipment_status" DEFAULT 'operational' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "equipment_maintenance" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"equipment_id" uuid NOT NULL,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"cost" numeric(14, 2),
	"performed_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"variety" text,
	"category" text,
	"unit" text DEFAULT 'kilograms' NOT NULL,
	"quantity_available" numeric(14, 2) DEFAULT '0' NOT NULL,
	"est_value_per_unit" numeric(14, 2),
	"reorder_threshold" numeric(14, 2),
	"avg_daily_usage" numeric(14, 2),
	"warehouse_id" uuid,
	"archived" text DEFAULT 'false',
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_recipe_ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"recipe_id" uuid NOT NULL,
	"ingredient_item_id" uuid NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"unit" text DEFAULT 'kilograms' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"produces_item_id" uuid NOT NULL,
	"recipe_makes_amount" numeric(14, 2) DEFAULT '1' NOT NULL,
	"recipe_makes_unit" text DEFAULT 'kilograms' NOT NULL,
	"instructions" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"item_id" uuid NOT NULL,
	"date" timestamp with time zone DEFAULT now() NOT NULL,
	"type" "inventory_transaction_type" NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"resulting_quantity" numeric(14, 2),
	"notes" text,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "warehouses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"location" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"type" "contact_type" DEFAULT 'customer' NOT NULL,
	"email" text,
	"phone" text,
	"address" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_id" uuid NOT NULL,
	"product_id" uuid,
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(14, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"contact_id" uuid,
	"date" date NOT NULL,
	"status" "order_status" DEFAULT 'pending' NOT NULL,
	"payment_method" text,
	"total" numeric(14, 2) DEFAULT '0' NOT NULL,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"sku" text,
	"category" text,
	"price" numeric(14, 2) DEFAULT '0' NOT NULL,
	"wholesale_price" numeric(14, 2),
	"linked_inventory_item_id" uuid,
	"active" text DEFAULT 'true' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budgets" ADD CONSTRAINT "budgets_category_id_accounting_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."accounting_categories"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_accounting_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."accounting_categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "grazing_records" ADD CONSTRAINT "grazing_records_livestock_group_id_livestock_groups_id_fk" FOREIGN KEY ("livestock_group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_activity" ADD CONSTRAINT "livestock_activity_livestock_id_livestock_id_fk" FOREIGN KEY ("livestock_id") REFERENCES "public"."livestock"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_members" ADD CONSTRAINT "livestock_group_members_group_id_livestock_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."livestock_groups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "livestock_group_members" ADD CONSTRAINT "livestock_group_members_livestock_id_livestock_id_fk" FOREIGN KEY ("livestock_id") REFERENCES "public"."livestock"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planting_activity" ADD CONSTRAINT "planting_activity_planting_id_plantings_id_fk" FOREIGN KEY ("planting_id") REFERENCES "public"."plantings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "plantings" ADD CONSTRAINT "plantings_crop_type_id_crop_types_id_fk" FOREIGN KEY ("crop_type_id") REFERENCES "public"."crop_types"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equipment_maintenance" ADD CONSTRAINT "equipment_maintenance_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "public"."equipment"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_warehouse_id_warehouses_id_fk" FOREIGN KEY ("warehouse_id") REFERENCES "public"."warehouses"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_recipe_ingredients" ADD CONSTRAINT "inventory_recipe_ingredients_recipe_id_inventory_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."inventory_recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_recipe_ingredients" ADD CONSTRAINT "inventory_recipe_ingredients_ingredient_item_id_inventory_items_id_fk" FOREIGN KEY ("ingredient_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_recipes" ADD CONSTRAINT "inventory_recipes_produces_item_id_inventory_items_id_fk" FOREIGN KEY ("produces_item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_item_id_inventory_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."inventory_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE set null ON UPDATE no action;