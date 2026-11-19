import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq, desc, inArray, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { formatNumber, formatMoney } from "@/lib/format";
import { makeRecipe, archiveRecipe, unarchiveRecipe, duplicateRecipe } from "@/lib/actions/resources-actions";
import { toKg, costPerKg, KG_PER_QUINTAL } from "@/lib/units";
import { Plus, AlertTriangle, Archive, ArchiveRestore, Pencil, Copy } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryRecipesPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; ingredient?: string; needed?: string; available?: string; unit?: string }>;
}) {
  const { id } = await params;
  const { error, ingredient, needed, available, unit } = await searchParams;
  const session = await getSession();
  const isAdmin = session?.role === "admin";
  const [item] = await db.select().from(schema.inventoryItems).where(eq(schema.inventoryItems.id, id)).limit(1);
  if (!item) notFound();

  // Newest recipe first — a just-created recipe should be immediately
  // visible at the top rather than buried below older ones. Non-admins
  // never see an archived recipe at all; admins see it further down, in
  // its own read-only-except-Unarchive section.
  const allRecipes = await db
    .select()
    .from(schema.inventoryRecipes)
    .where(eq(schema.inventoryRecipes.producesItemId, id))
    .orderBy(desc(schema.inventoryRecipes.createdAt));
  const recipes = isAdmin ? allRecipes : allRecipes.filter((r) => !r.archived);

  // How many times each recipe has actually been made, and how much it's
  // produced in total — the "N batches made" trail, keyed by recipeId
  // rather than by matching on the recipe's name (see the `recipeId`
  // column's doc comment in src/db/schema/resources.ts). Older history
  // recorded before that column existed was best-effort backfilled by a
  // migration, so it's included too wherever it could be matched.
  const recipeIds = recipes.map((r) => r.id);
  const produceTxns = recipeIds.length
    ? await db
        .select({ recipeId: schema.inventoryTransactions.recipeId, amount: schema.inventoryTransactions.amount })
        .from(schema.inventoryTransactions)
        .where(
          and(
            inArray(schema.inventoryTransactions.recipeId, recipeIds),
            eq(schema.inventoryTransactions.type, "recipe_produce")
          )
        )
    : [];
  const batchStatsByRecipe = new Map<string, { runs: number; totalProduced: number }>();
  for (const t of produceTxns) {
    if (!t.recipeId) continue;
    const prev = batchStatsByRecipe.get(t.recipeId) ?? { runs: 0, totalProduced: 0 };
    prev.runs += 1;
    prev.totalProduced += parseFloat(t.amount);
    batchStatsByRecipe.set(t.recipeId, prev);
  }

  const recipesWithIngredients = await Promise.all(
    recipes.map(async (r) => {
      const rawIngredients = await db
        .select({
          amount: schema.inventoryRecipeIngredients.amount,
          unit: schema.inventoryRecipeIngredients.unit,
          name: schema.inventoryItems.name,
          itemUnit: schema.inventoryItems.unit,
          avgUnitCost: schema.inventoryItems.avgUnitCost,
        })
        .from(schema.inventoryRecipeIngredients)
        .innerJoin(schema.inventoryItems, eq(schema.inventoryItems.id, schema.inventoryRecipeIngredients.ingredientItemId))
        .where(eq(schema.inventoryRecipeIngredients.recipeId, r.id));

      // Direct raw-material cost per ingredient, from its current
      // weighted-average cost — normalized to kg so mismatched units
      // (e.g. an ingredient priced per quintal) still line up.
      const ingredients = rawIngredients.map((ing) => {
        const amountKg = toKg(parseFloat(ing.amount), ing.unit);
        const cost = ing.avgUnitCost ? amountKg * costPerKg(parseFloat(ing.avgUnitCost), ing.itemUnit) : null;
        return { ...ing, cost };
      });

      const knownCosts = ingredients.filter((i) => i.cost !== null);
      const totalCost = knownCosts.reduce((sum, i) => sum + (i.cost ?? 0), 0);
      const outputKg = toKg(parseFloat(r.recipeMakesAmount), r.recipeMakesUnit);
      const costPerQuintal = outputKg > 0 ? (totalCost / outputKg) * KG_PER_QUINTAL : null;
      const allCostsKnown = knownCosts.length === ingredients.length && ingredients.length > 0;

      const stats = batchStatsByRecipe.get(r.id);
      const makesAmount = parseFloat(r.recipeMakesAmount);
      const batchesMade = stats && makesAmount > 0 ? stats.totalProduced / makesAmount : 0;

      return {
        ...r,
        ingredients,
        totalCost,
        costPerQuintal,
        allCostsKnown,
        missingCostCount: ingredients.length - knownCosts.length,
        runsMade: stats?.runs ?? 0,
        batchesMade,
        totalProduced: stats?.totalProduced ?? 0,
      };
    })
  );

  const activeRecipes = recipesWithIngredients.filter((r) => !r.archived);
  const archivedRecipes = recipesWithIngredients.filter((r) => r.archived);

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

      {error === "insufficient-stock" && (
        <div
          className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-md border text-sm font-medium"
          style={{ background: "var(--color-danger-bg)", borderColor: "#e6b3ac", color: "var(--color-danger)" }}
        >
          <AlertTriangle size={16} />
          {needed && available
            ? (
                <>
                  Not enough &quot;{ingredient ?? "ingredient"}&quot; to make this: needs {formatNumber(needed)}{" "}
                  {unit ?? ""}, only {formatNumber(available)} {unit ?? ""} available. Nothing was consumed or made —
                  restock it, make fewer batches, or edit the recipe before trying again.
                </>
              )
            : <>You don&apos;t have enough &quot;{ingredient ?? "ingredient"}&quot; to make this recipe.</>}
        </div>
      )}

      {error === "recipe-archived" && (
        <div
          className="flex items-center gap-2 mb-5 px-4 py-2.5 rounded-md border text-sm font-medium"
          style={{ background: "var(--color-danger-bg)", borderColor: "#e6b3ac", color: "var(--color-danger)" }}
        >
          <AlertTriangle size={16} />
          That recipe is archived and can&apos;t be made any more. Unarchive it first, or duplicate it into a new one.
        </div>
      )}

      {activeRecipes.length === 0 ? (
        <div className="kf-card p-10 text-center text-gray-400">No recipes defined for {item.name} yet.</div>
      ) : (
        <div className="space-y-4">
          {activeRecipes.map((r) => (
            <div key={r.id} className="kf-card p-5">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-semibold">{r.name}</h3>
                  <p className="text-sm text-gray-500">
                    Makes {formatNumber(r.recipeMakesAmount)} {r.recipeMakesUnit}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {r.runsMade > 0
                      ? `${formatNumber(r.batchesMade)} batch${r.batchesMade !== 1 ? "es" : ""} made (${r.runsMade} run${r.runsMade !== 1 ? "s" : ""}) — ${formatNumber(r.totalProduced)} ${r.recipeMakesUnit} total`
                      : "No batches made yet with this formula."}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  {/* Make Recipe is the action people use constantly, so it
                      stays the one full-size, full-color button here.
                      Edit/Duplicate/Archive are occasional, lower-stakes
                      actions — kept small and muted (kf-btn-ghost) in their
                      own row underneath, so they read as a "more options"
                      afterthought rather than four equally-weighted choices
                      someone could tap by mistake while trying to make a
                      batch. */}
                  <form action={makeRecipe.bind(null, r.id)} className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5">
                      <span className="text-xs text-gray-400 whitespace-nowrap">Batches</span>
                      {/* Sized for a thumb, not a mouse — this was easy to
                          mis-tap or mis-type on a phone (and once did:
                          a stray extra digit here is how a past "make
                          recipe" attempt asked for 181 batches instead of
                          the intended amount). Wider box, bigger tap
                          target, and the "Batches" label so it's never a
                          mystery number next to the button. */}
                      <input
                        type="number"
                        name="batches"
                        defaultValue={1}
                        min={1}
                        inputMode="numeric"
                        className="kf-input w-20 text-center"
                        style={{ minHeight: "2.75rem", fontSize: "1rem" }}
                      />
                    </label>
                    <button type="submit" className="kf-btn-primary" style={{ minHeight: "2.75rem" }}>
                      Make Recipe
                    </button>
                  </form>
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/resources/inventory/${id}/recipes/${r.id}/edit`}
                      className="kf-btn-ghost"
                      title="Edit this recipe"
                    >
                      <Pencil size={12} /> Edit
                    </Link>
                    <form action={duplicateRecipe.bind(null, id, r.id)}>
                      <button
                        type="submit"
                        className="kf-btn-ghost"
                        title="Duplicate this recipe into a new one you can edit — keeps this one's batch history separate"
                      >
                        <Copy size={12} /> Duplicate
                      </button>
                    </form>
                    {isAdmin && (
                      <form action={archiveRecipe.bind(null, id, r.id)}>
                        <button
                          type="submit"
                          className="kf-btn-ghost"
                          title="Archive this recipe — keeps its batch history, just takes it out of active use"
                        >
                          <Archive size={12} /> Archive
                        </button>
                      </form>
                    )}
                  </div>
                </div>
              </div>
              <table className="w-full kf-table mt-2">
                <thead>
                  <tr>
                    <th>Ingredient</th>
                    <th>Amount</th>
                    <th>Direct Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {r.ingredients.map((ing, i) => (
                    <tr key={i}>
                      <td>{ing.name}</td>
                      <td>
                        {formatNumber(ing.amount)} {ing.unit}
                      </td>
                      <td>{ing.cost !== null ? formatMoney(ing.cost) : <span className="text-gray-400">no cost yet</span>}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="font-semibold">Direct raw material cost</td>
                    <td className="text-gray-500 text-xs">
                      {!r.allCostsKnown &&
                        `${r.missingCostCount} ingredient${r.missingCostCount !== 1 ? "s" : ""} missing a cost`}
                    </td>
                    <td className="font-semibold">
                      {r.totalCost > 0 ? formatMoney(r.totalCost) : "—"}
                      {r.costPerQuintal !== null && r.costPerQuintal > 0 && (
                        <span className="block text-xs font-normal text-gray-500 mt-0.5">
                          {formatMoney(r.costPerQuintal)} / quintal
                        </span>
                      )}
                    </td>
                  </tr>
                </tfoot>
              </table>
              {!r.allCostsKnown && (
                <p className="text-xs text-gray-400 mt-2">
                  Record a price paid when adding stock for every ingredient to get a complete per-quintal cost.
                </p>
              )}
              {r.instructions && <p className="text-sm text-gray-500 mt-3">{r.instructions}</p>}
            </div>
          ))}
        </div>
      )}

      {isAdmin && archivedRecipes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3">
            Archived (admin only — hidden from everyone else, batch history kept)
          </h2>
          <div className="space-y-3">
            {archivedRecipes.map((r) => (
              <div key={r.id} className="kf-card p-4 opacity-70">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">
                      {r.name} <span className="text-xs font-normal text-gray-400">(archived)</span>
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.runsMade > 0
                        ? `${formatNumber(r.batchesMade)} batch${r.batchesMade !== 1 ? "es" : ""} made (${r.runsMade} run${r.runsMade !== 1 ? "s" : ""}) — ${formatNumber(r.totalProduced)} ${r.recipeMakesUnit} total`
                        : "No batches were ever made with this formula."}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/resources/inventory/${id}/recipes/${r.id}/edit`}
                      className="kf-btn-ghost"
                      title="Edit this archived recipe"
                    >
                      <Pencil size={12} /> Edit
                    </Link>
                    <form action={unarchiveRecipe.bind(null, id, r.id)}>
                      <button
                        type="submit"
                        className="kf-btn-secondary flex items-center gap-1.5 text-xs py-1 px-2"
                        title="Bring this recipe back into active use"
                      >
                        <ArchiveRestore size={13} /> Unarchive
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
