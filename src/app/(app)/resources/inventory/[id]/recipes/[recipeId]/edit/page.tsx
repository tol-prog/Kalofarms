import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { updateRecipe } from "@/lib/actions/resources-actions";
import { IngredientsEditor } from "../../ingredients-editor";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string; recipeId: string }>;
}) {
  const { id, recipeId } = await params;
  const [item] = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, id)).limit(1);
  if (!item) notFound();

  const [recipe] = await db.select().from(schema.inventoryRecipes).where(eq(schema.inventoryRecipes.id, recipeId)).limit(1);
  if (!recipe || recipe.producesItemId !== id) notFound();

  const items = await db
    .select({ id: schema.inventoryItems.id, name: schema.inventoryItems.name, unit: schema.inventoryItems.unit })
    .from(schema.inventoryItems)
    .orderBy(asc(schema.inventoryItems.name));
  const itemsById = new Map(items.map((it) => [it.id, it]));

  const rawIngredients = await db
    .select()
    .from(schema.inventoryRecipeIngredients)
    .where(eq(schema.inventoryRecipeIngredients.recipeId, recipeId));

  const initialIngredients = rawIngredients
    .map((ing) => {
      const ingredientItem = itemsById.get(ing.ingredientItemId);
      if (!ingredientItem) return null;
      return { item: ingredientItem, amount: ing.amount, unit: ing.unit };
    })
    .filter((x): x is { item: { id: string; name: string; unit: string }; amount: string; unit: string } => x !== null);

  const boundUpdate = updateRecipe.bind(null, id, recipeId);

  return (
    <div>
      <PageHeader
        title={`Edit Recipe — ${recipe.name}`}
        description={
          recipe.archived
            ? `For ${item.name} — this recipe is archived; saving changes does not bring it back into active use.`
            : `For ${item.name}`
        }
      />
      <form action={boundUpdate} className="kf-card p-6 max-w-2xl space-y-4">
        <div>
          <label className="kf-label">Recipe Name</label>
          <input name="name" required defaultValue={recipe.name} className="kf-input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Recipe Makes</label>
            <input type="number" step="0.01" name="recipeMakesAmount" defaultValue={recipe.recipeMakesAmount} className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Unit</label>
            <input name="recipeMakesUnit" defaultValue={recipe.recipeMakesUnit} className="kf-input" />
          </div>
        </div>

        <IngredientsEditor items={items} initialIngredients={initialIngredients} />

        <div>
          <label className="kf-label">Instructions</label>
          <textarea name="instructions" rows={3} defaultValue={recipe.instructions ?? ""} className="kf-input" />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary">
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
