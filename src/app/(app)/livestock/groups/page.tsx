import Link from "next/link";
import { db, schema } from "@/db";
import { sql, eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { hideLivestockGroup, unhideLivestockGroup } from "@/lib/actions/livestock-actions";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Plus, EyeOff, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LivestockGroupsPage() {
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  const allGroups = await db
    .select({
      id: schema.livestockGroups.id,
      name: schema.livestockGroups.name,
      type: schema.livestockGroups.type,
      archived: schema.livestockGroups.archived,
      animalCount: sql<number>`coalesce(sum(${schema.livestock.numberInSet}), 0)`,
    })
    .from(schema.livestockGroups)
    .leftJoin(schema.livestockGroupMembers, eq(schema.livestockGroupMembers.groupId, schema.livestockGroups.id))
    .leftJoin(schema.livestock, eq(schema.livestock.id, schema.livestockGroupMembers.livestockId))
    .groupBy(schema.livestockGroups.id);

  // Hidden groups are only visible to admins, data preserved either way.
  const groups = isAdmin ? allGroups : allGroups.filter((g) => !g.archived);
  const hiddenCount = allGroups.filter((g) => g.archived).length;

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
              {isAdmin && <th></th>}
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 4 : 3} className="text-center text-gray-400 py-10">
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
                  {g.archived && (
                    <Badge variant="muted" className="ml-2">
                      hidden
                    </Badge>
                  )}
                </td>
                <td>{Number(g.animalCount).toLocaleString()}</td>
                <td className="capitalize">{g.type}</td>
                {isAdmin && (
                  <td>
                    <form action={(g.archived ? unhideLivestockGroup : hideLivestockGroup).bind(null, g.id)}>
                      <button
                        type="submit"
                        className="text-gray-400 hover:text-[--color-primary] flex items-center gap-1 text-xs"
                        title={g.archived ? "Unhide" : "Hide from non-admins"}
                      >
                        {g.archived ? <Eye size={14} /> : <EyeOff size={14} />}
                      </button>
                    </form>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isAdmin && hiddenCount > 0 && (
        <p className="text-xs text-gray-400 mt-2">Including {hiddenCount} hidden group{hiddenCount !== 1 ? "s" : ""}, visible to admins only.</p>
      )}
    </div>
  );
}
