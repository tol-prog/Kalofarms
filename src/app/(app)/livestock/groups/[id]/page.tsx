import { notFound } from "next/navigation";
import Link from "next/link";
import { db, schema } from "@/db";
import { eq, notInArray, and, ne } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { formatNumber } from "@/lib/format";
import {
  addLivestockToGroup,
  removeLivestockFromGroup,
  hideLivestockGroup,
  unhideLivestockGroup,
} from "@/lib/actions/livestock-actions";
import { X, EyeOff, Eye } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LivestockGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  const isAdmin = session?.role === "admin";

  const [group] = await db.select().from(schema.livestockGroups).where(eq(schema.livestockGroups.id, id)).limit(1);
  if (!group) notFound();
  // Hidden groups are invisible to non-admins everywhere, including by
  // direct link — data preserved, just not shown outside admin view.
  if (!isAdmin && group.archived) notFound();

  const allMembers = await db
    .select({
      memberId: schema.livestockGroupMembers.id,
      livestockId: schema.livestock.id,
      name: schema.livestock.nameOrLabel,
      animalType: schema.livestock.animalType,
      numberInSet: schema.livestock.numberInSet,
      status: schema.livestock.status,
    })
    .from(schema.livestockGroupMembers)
    .innerJoin(schema.livestock, eq(schema.livestock.id, schema.livestockGroupMembers.livestockId))
    .where(eq(schema.livestockGroupMembers.groupId, id));

  // Non-admins only see members that aren't themselves individually hidden.
  const members = isAdmin ? allMembers : allMembers.filter((m) => m.status !== "archived");

  const memberIds = allMembers.map((m) => m.livestockId);
  // Hidden animals aren't offered for adding to a group either way.
  const available = await db
    .select({ id: schema.livestock.id, nameOrLabel: schema.livestock.nameOrLabel })
    .from(schema.livestock)
    .where(
      and(
        memberIds.length > 0 ? notInArray(schema.livestock.id, memberIds) : undefined,
        ne(schema.livestock.status, "archived")
      )
    );

  const boundAdd = addLivestockToGroup.bind(null, id);
  const boundHideToggle = (group.archived ? unhideLivestockGroup : hideLivestockGroup).bind(null, id);

  return (
    <div>
      <PageHeader
        title={group.name}
        description={`${group.type === "smart" ? "Smart" : "Set"} group`}
        actions={
          <>
            {group.archived && <Badge variant="muted">hidden</Badge>}
            {isAdmin && (
              <form action={boundHideToggle}>
                <button type="submit" className="kf-btn-secondary flex items-center gap-1.5">
                  {group.archived ? (
                    <>
                      <Eye size={14} /> Unhide
                    </>
                  ) : (
                    <>
                      <EyeOff size={14} /> Hide
                    </>
                  )}
                </button>
              </form>
            )}
          </>
        }
      />

      <div className="kf-card p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3">Add Animal to Group</h2>
        <form action={boundAdd} className="flex gap-2 max-w-md">
          <select name="livestockId" className="kf-input" required>
            <option value="">Select an animal…</option>
            {available.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nameOrLabel}
              </option>
            ))}
          </select>
          <button type="submit" className="kf-btn-primary shrink-0">
            Add
          </button>
        </form>
      </div>

      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Animal</th>
              <th>Type</th>
              <th>Number in Set</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  No animals in this group yet.
                </td>
              </tr>
            )}
            {members.map((m) => (
              <tr key={m.memberId}>
                <td>
                  <Link href={`/livestock/animals/${m.livestockId}`} className="font-medium text-[--color-primary] hover:underline">
                    {m.name}
                  </Link>
                </td>
                <td>{m.animalType}</td>
                <td>{formatNumber(m.numberInSet)}</td>
                <td className="capitalize">{m.status}</td>
                <td>
                  <form action={removeLivestockFromGroup.bind(null, id, m.memberId)}>
                    <button type="submit" className="text-gray-400 hover:text-[--color-danger]" title="Remove from group">
                      <X size={15} />
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
