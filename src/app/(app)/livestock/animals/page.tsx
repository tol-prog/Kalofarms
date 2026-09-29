import Link from "next/link";
import { db, schema } from "@/db";
import { desc } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { hideLivestock, unhideLivestock } from "@/lib/actions/livestock-actions";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import { Plus, EyeOff, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AnimalsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  const allAnimals = await db.select().from(schema.livestock).orderBy(desc(schema.livestock.createdAt));
  // Hidden (status "archived") animals are only visible to admins — their
  // data is never deleted, just kept out of the everyday list for everyone
  // else. Admins see them too, marked with their "archived" status badge.
  const animals = isAdmin ? allAnimals : allAnimals.filter((a) => a.status !== "archived");
  const hiddenCount = allAnimals.filter((a) => a.status === "archived").length;

  const totalAnimals = animals.reduce((sum, a) => sum + a.numberInSet, 0);
  const chickenCount = animals
    .filter((a) => a.animalType.toLowerCase() === "chicken")
    .reduce((sum, a) => sum + a.numberInSet, 0);
  const cattleCount = animals
    .filter((a) => a.animalType.toLowerCase() === "cattle")
    .reduce((sum, a) => sum + a.numberInSet, 0);
  const femaleCount = animals.filter((a) => a.gender === "Female").length;

  const stats = [
    { label: "Animals", value: totalAnimals, of: totalAnimals },
    { label: "Chicken", value: chickenCount, of: totalAnimals },
    { label: "Cattle", value: cattleCount, of: totalAnimals },
    { label: "Female", value: femaleCount, of: animals.length },
  ];

  return (
    <div>
      <PageHeader
        title="Livestock"
        actions={
          <Link href="/livestock/animals/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Animal
          </Link>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {stats.map((s) => (
          <div key={s.label} className="kf-card p-4">
            <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-2xl font-semibold mt-1">{formatNumber(s.value)}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {s.of > 0 ? Math.round((s.value / s.of) * 100) : 0}% of {formatNumber(s.of)}
            </p>
          </div>
        ))}
      </div>

      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Animal</th>
              <th>Gender</th>
              <th>Number in Set</th>
              <th>Last Weight (kg)</th>
              <th>Status</th>
              <th>Type</th>
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {animals.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 7 : 6} className="text-center text-gray-400 py-10">
                  No animals recorded yet. Click &ldquo;Add Animal&rdquo; to get started.
                </td>
              </tr>
            )}
            {animals.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/livestock/animals/${a.id}`} className="font-medium text-[--color-primary] hover:underline">
                    {a.nameOrLabel}
                  </Link>
                  <div className="text-xs text-gray-400">
                    {a.numberInSet > 1 ? `x${formatNumber(a.numberInSet)} ` : ""}
                    {a.internalId ? `#${a.internalId}` : ""}
                  </div>
                </td>
                <td>{a.gender ?? "—"}</td>
                <td>{formatNumber(a.numberInSet)}</td>
                <td>{a.lastWeight ?? "—"}</td>
                <td>
                  <Badge variant={statusVariant(a.status)}>{a.status}</Badge>
                </td>
                <td>
                  {a.animalType}
                  {a.breed ? <span className="kf-badge bg-[--color-badge-muted-bg] text-[--color-badge-muted-text] ml-1.5">{a.breed}</span> : null}
                </td>
                {isAdmin && (
                  <td>
                    <form action={(a.status === "archived" ? unhideLivestock : hideLivestock).bind(null, a.id)}>
                      <button
                        type="submit"
                        className="text-gray-400 hover:text-[--color-primary] flex items-center gap-1 text-xs"
                        title={a.status === "archived" ? "Unhide" : "Hide from non-admins"}
                      >
                        {a.status === "archived" ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {animals.length > 0 && (
        <p className="text-xs text-gray-400 mt-2">
          Displaying {animals.length} record{animals.length !== 1 ? "s" : ""}
          {isAdmin && hiddenCount > 0 ? ` (including ${hiddenCount} hidden, visible to admins only)` : ""}
        </p>
      )}
    </div>
  );
}
