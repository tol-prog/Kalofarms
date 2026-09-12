import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { createRecipe } from "@/lib/actions/resources-actions";
import { IngredientsEditor } from "./ingredients-editor";

export default async function NewRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [item] = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, id)).limit(1);
  if (!item) notFound();

  const items = await db
    .select({ id: schema.inventoryItems.id, name: schema.inventoryItems.name, unit: schema.inventoryItems.unit })
    .from(schema.inventoryItems)
    .orderBy(asc(schema.inventoryItems.name));

  const boundCreate = createRecipe.bind(null, id);

  return (
    <div>
      <PageHeader title={`New Recipe — ${item.name}`} />
      <form action={boundCreate} className="kf-card p-6 max-w-2xl space-y-4">
        <div>
          <label className="kf-label">Recipe Name</label>
          <input name="name" required className="kf-input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">Recipe Makes</label>
            <input type="number" step="0.01" name="recipeMakesAmount" defaultValue={1} className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Unit</label>
            <input name="recipeMakesUnit" defaultValue={item.unit} className="kf-input" />
          </div>
        </div>

        <IngredientsEditor items={items} />

        <div>
          <label className="kf-label">Instructions</label>
          <textarea name="instructions" rows={3} className="kf-input" />
        </div>

        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary">
            Create Recipe
          </button>
        </div>
      </form>
    </div>
  );
}
