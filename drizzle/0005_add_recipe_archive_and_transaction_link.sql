ALTER TABLE "inventory_recipes" ADD COLUMN "archived" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD COLUMN "recipe_id" uuid;--> statement-breakpoint
ALTER TABLE "inventory_transactions" ADD CONSTRAINT "inventory_transactions_recipe_id_inventory_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "public"."inventory_recipes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
UPDATE "inventory_transactions" t
SET "recipe_id" = r.id
FROM "inventory_recipes" r
WHERE t.type = 'recipe_consume'
  AND t.notes = 'Used in recipe: ' || r.name
  AND t.recipe_id IS NULL
  AND (SELECT count(*) FROM "inventory_recipes" r2 WHERE r2.name = r.name) = 1;--> statement-breakpoint
UPDATE "inventory_transactions" t
SET "recipe_id" = r.id
FROM "inventory_recipes" r
WHERE t.type = 'recipe_produce'
  AND t.notes = 'Made via recipe: ' || r.name
  AND t.recipe_id IS NULL
  AND (SELECT count(*) FROM "inventory_recipes" r2 WHERE r2.name = r.name) = 1;
