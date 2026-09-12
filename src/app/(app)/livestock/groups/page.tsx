import Link from "next/link";
import { db, schema } from "@/db";
import { sql, eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LivestockGroupsPage() {
  const groups = await db
    .select({
      id: schema.livestockGroups.id,
      name: schema.livestockGroups.name,
      type: schema.livestockGroups.type,
      animalCount: sql<number>`coalesce(sum(${schema.livestock.numberInSet}), 0)`,
    })
    .from(schema.livestockGroups)
    .leftJoin(schema.livestockGroupMembers, eq(schema.livestockGroupMembers.groupId, schema.livestockGroups.id))
    .leftJoin(schema.livestock, eq(schema.livestock.id, schema.livestockGroupMembers.livestockId))
    .groupBy(schema.livestockGroups.id);

  return (
    <div>
      <PageHeader
        title="Livestock Groups"
        actions={
          <Link href="/livestock/groups/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Livestock Group
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Animals</th>
              <th>Type</th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-gray-400 py-10">
                  No livestock groups yet.
                </td>
              </tr>
            )}
            {groups.map((g) => (
              <tr key={g.id}>
                <td>
                  <Link href={`/livestock/groups/${g.id}`} className="font-medium text-[--color-primary] hover:underline">
                    {g.name}
                  </Link>
                </td>
                <td>{Number(g.animalCount).toLocaleString()}</td>
                <td className="capitalize">{g.type}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
