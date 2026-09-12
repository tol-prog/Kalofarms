/**
 * One-time import of a full Farmbrite data export taken on 2026-09-12,
 * just before the Farmbrite subscription was cancelled. Fills in real data
 * that the original screenshot-based seed (scripts/seed.ts) didn't have:
 *   - the complete transaction history (711 real transactions)
 *   - the farm's real feed recipes (17 recipes / 145 ingredient lines,
 *     replacing the placeholder "Broiler Chicken 1" recipe with the real one)
 *   - the accounting category "Capital investment 1" (Farmbrite renamed
 *     "Capital investment" to this at some point; historical transactions
 *     still reference the old name, which this script also creates)
 *
 * Idempotent for categories and recipes (matched by name). Transactions are
 * only imported if the transactions table is currently empty, since
 * individual rows have no stable external id to de-duplicate against —
 * this prevents double-importing if a deploy retries.
 *
 * Usage: DATABASE_URL=... npx tsx scripts/import-farmbrite-2026-09.ts
 */
import fs from "node:fs";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db, schema } from "../src/db";

const dataDir = path.join(__dirname, "data");

type CategoryRow = { name: string; type: "income" | "expense"; description?: string; taxLine?: string };
type RecipeRow = {
  produces_item: string;
  recipe_name: string;
  makes_amount: string;
  makes_unit: string;
  ingredients: { name: string; amount: string; unit: string }[];
};
type TransactionRow = {
  date: string;
  category: string | null;
  type: "income" | "expense" | "transfer";
  amount: string;
  description: string | null;
};

function stripVariety(name: string): string {
  // "Maize (Ethiopian Maize)" -> "Maize"
  return name.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

async function main() {
  console.log("Importing 2026-09-12 Farmbrite export...");

  // --- Accounting categories (idempotent upsert by name) -----------------
  const categories: CategoryRow[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, "farmbrite-categories.json"), "utf-8")
  );
  const categoryIds: Record<string, string> = {};
  const existingCats = await db.select().from(schema.accountingCategories);
  for (const c of existingCats) categoryIds[c.name] = c.id;

  let categoriesAdded = 0;
  for (const c of categories) {
    if (categoryIds[c.name]) continue;
    const [row] = await db
      .insert(schema.accountingCategories)
      .values({ name: c.name, type: c.type, description: c.description, taxLine: c.taxLine })
      .returning();
    categoryIds[c.name] = row.id;
    categoriesAdded++;
  }
  console.log(`  Categories: ${categoriesAdded} added, ${categories.length - categoriesAdded} already present.`);

  // --- Inventory item id lookup -------------------------------------------
  const items = await db.select().from(schema.inventoryItems);
  const itemIds: Record<string, string> = {};
  for (const i of items) itemIds[i.name] = i.id;

  // --- Recipes (idempotent by recipe name; special-case the real Broiler
  //     Chicken 1 recipe replacing the original placeholder) --------------
  const recipes: RecipeRow[] = JSON.parse(
    fs.readFileSync(path.join(dataDir, "farmbrite-recipes.json"), "utf-8")
  );

  let recipesAdded = 0;
  let recipesUpdated = 0;
  let recipesSkipped = 0;
  for (const r of recipes) {
    const producesId = itemIds[r.produces_item];
    if (!producesId) {
      console.warn(`  ! Skipping recipe "${r.recipe_name}": inventory item "${r.produces_item}" not found.`);
      recipesSkipped++;
      continue;
    }

    // Match case-insensitively: Farmbrite's own recipe names and our
    // originally-seeded placeholder don't always agree on casing
    // ("Broiler Chicken 1" vs "Broiler chicken 1").
    const candidates = await db
      .select()
      .from(schema.inventoryRecipes)
      .where(eq(schema.inventoryRecipes.producesItemId, producesId));
    const existing = candidates.filter((c) => c.name.toLowerCase() === r.recipe_name.toLowerCase());

    let recipeId: string;
    if (existing.length > 0) {
      // Real "Broiler Chicken 1" replaces the placeholder: refresh its
      // ingredients and makes-amount to match the real Farmbrite recipe.
      recipeId = existing[0].id;
      await db
        .update(schema.inventoryRecipes)
        .set({ name: r.recipe_name, recipeMakesAmount: r.makes_amount, recipeMakesUnit: r.makes_unit })
        .where(eq(schema.inventoryRecipes.id, recipeId));
      await db.delete(schema.inventoryRecipeIngredients).where(eq(schema.inventoryRecipeIngredients.recipeId, recipeId));
      recipesUpdated++;
    } else {
      const [row] = await db
        .insert(schema.inventoryRecipes)
        .values({
          name: r.recipe_name,
          producesItemId: producesId,
          recipeMakesAmount: r.makes_amount,
          recipeMakesUnit: r.makes_unit,
        })
        .returning();
      recipeId = row.id;
      recipesAdded++;
    }

    for (const ing of r.ingredients) {
      const baseName = stripVariety(ing.name);
      const ingredientId = itemIds[baseName] ?? itemIds[ing.name];
      if (!ingredientId) {
        console.warn(`  ! Recipe "${r.recipe_name}": ingredient "${ing.name}" not found in inventory, skipped.`);
        continue;
      }
      await db.insert(schema.inventoryRecipeIngredients).values({
        recipeId,
        ingredientItemId: ingredientId,
        amount: ing.amount,
        unit: ing.unit,
      });
    }
  }
  console.log(`  Recipes: ${recipesAdded} added, ${recipesUpdated} updated (real ingredients replacing placeholder), ${recipesSkipped} skipped.`);

  // --- Transactions (only if table is currently empty) --------------------
  const existingTxCount = await db.select().from(schema.transactions);
  if (existingTxCount.length > 0) {
    console.log(`  Transactions: table already has ${existingTxCount.length} rows — skipping import to avoid duplicates.`);
  } else {
    const transactions: TransactionRow[] = JSON.parse(
      fs.readFileSync(path.join(dataDir, "farmbrite-transactions.json"), "utf-8")
    );

    const toInsert: (typeof schema.transactions.$inferInsert)[] = [];
    for (const t of transactions) {
      let categoryId: string | null = null;
      if (t.category) {
        if (!categoryIds[t.category]) {
          const [row] = await db
            .insert(schema.accountingCategories)
            .values({ name: t.category, type: t.type === "income" ? "income" : "expense" })
            .returning();
          categoryIds[t.category] = row.id;
          console.log(`  + Created category "${t.category}" referenced by a historical transaction.`);
        }
        categoryId = categoryIds[t.category];
      }
      toInsert.push({
        date: t.date,
        categoryId,
        type: t.type,
        amount: t.amount,
        description: t.description ?? undefined,
      });
    }

    const batchSize = 200;
    for (let i = 0; i < toInsert.length; i += batchSize) {
      await db.insert(schema.transactions).values(toInsert.slice(i, i + batchSize));
    }
    console.log(`  Transactions: ${toInsert.length} imported (Jun 2025 - Jul 2026 history).`);
  }

  console.log("Import complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
