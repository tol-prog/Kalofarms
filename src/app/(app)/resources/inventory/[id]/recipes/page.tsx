import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatNumber } from "@/lib/format";
import { makeRecipe } from "@/lib/actions/resources-actions";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryRecipesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item] = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, id)).limit(1);
  if (!item) notFound();

  const recipes = await db
    .select()
    .from(schema.inventoryRecipes)
    .where(eq(schema.inventoryRecipes.producesItemId, id));

  const recipesWithIngredients = await Promise.all(
    recipes.map(async (r) => ({
      ...r,
      ingredients: await db
        .select({
          amount: schema.inventoryRecipeIngredients.amount,
          unit: schema.inventoryRecipeIngredients.unit,
          name: schema.inventoryItems.name,
        })
        .from(schema.inventoryRecipeIngredients)
        .innerJoin(schema.inventoryItems, eq(schema.inventoryItems.id, schema.inventoryRecipeIngredients.ingredientItemId))
        .where(eq(schema.inventoryRecipeIngredients.recipeId, r.id)),
    }))
  );

  return (
    <div>
      <PageHeader
        title={`${item.name} — Recipes`}
        actions={
          <Link href={`/resources/inventory/${id}/recipes/new`} className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> New Recipe
          </Link>
        }
      />

      {recipesWithIngredients.length === 0 ? (
        <div className="kf-card p-10 text-center text-gray-400">No recipes defined for {item.name} yet.</div>
      ) : (
        <div className="space-y-4">
          {recipesWithIngredients.map((r) => (
            <div key={r.id} className="kf-card p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-sm text-gray-500">
                    Makes {formatNumber(r.recipeMakesAmount)} {r.recipeMakesUnit}
                  </p>
                </div>
                <form action={makeRecipe.bind(null, r.id)} className="flex items-center gap-2">
                  <input type="number" name="batches" defaultValue={1} min={1} className="kf-input w-20" />
                  <button type="submit" className="kf-btn-primary">
                    Make Recipe
                  </button>
                </form>
              </div>
              <table className="w-full kf-table mt-2">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {r.ingredients.map((ing, i) => (
                    <tr key={i}>
                      <td>{ing.name}</td>
                      <td>
                        {formatNumber(ing.amount)} {ing.unit}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {r.instructions && <p className="text-sm text-gray-500 mt-3">{r.instructions}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
