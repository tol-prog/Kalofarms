import { notFound } from "next/navigation";
import Link from "next/link";
import { db, schema } from "@/db";
import { eq, notInArray } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatNumber } from "@/lib/format";
import { addLivestockToGroup, removeLivestockFromGroup } from "@/lib/actions/livestock-actions";
import { X } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LivestockGroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [group] = await db.select().from(schema.livestockGroups).where(eq(schema.livestockGroups.id, id)).limit(1);
  if (!group) notFound();

  const members = await db
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

  const memberIds = members.map((m) => m.livestockId);
  const available = await db
    .select({ id: schema.livestock.id, nameOrLabel: schema.livestock.nameOrLabel })
    .from(schema.livestock)
    .where(memberIds.length > 0 ? notInArray(schema.livestock.id, memberIds) : undefined);

  const boundAdd = addLivestockToGroup.bind(null, id);

  return (
    <div>
      <PageHeader title={group.name} description={`${group.type === "smart" ? "Smart" : "Set"} group`} />

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
