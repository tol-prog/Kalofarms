import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatDate } from "@/lib/format";
import { createGrazingRecord } from "@/lib/actions/livestock-actions";

export const dynamic = "force-dynamic";

export default async function GrazingPage() {
  const [records, groups] = await Promise.all([
    db
      .select({
        id: schema.grazingRecords.id,
        paddockName: schema.grazingRecords.paddockName,
        startDate: schema.grazingRecords.startDate,
        endDate: schema.grazingRecords.endDate,
        notes: schema.grazingRecords.notes,
        groupName: schema.livestockGroups.name,
      })
      .from(schema.grazingRecords)
      .leftJoin(schema.livestockGroups, eq(schema.livestockGroups.id, schema.grazingRecords.livestockGroupId))
      .orderBy(desc(schema.grazingRecords.startDate)),
    db.select().from(schema.livestockGroups),
  ]);

  return (
    <div>
      <PageHeader title="Grazing" description="Paddock rotation and grazing history" />

      <div className="kf-card p-5 mb-5">
        <h2 className="text-sm font-semibold mb-3">Add Grazing Record</h2>
        <form action={createGrazingRecord} className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="kf-label">Paddock</label>
            <input name="paddockName" required className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Livestock Group</label>
            <select name="livestockGroupId" className="kf-input">
              <option value="">None</option>
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="kf-label">Start Date</label>
            <input type="date" name="startDate" required className="kf-input" defaultValue={new Date().toISOString().slice(0, 10)} />
          </div>
          <div>
            <label className="kf-label">End Date</label>
            <input type="date" name="endDate" className="kf-input" />
          </div>
          <div className="col-span-2 md:col-span-4">
            <button type="submit" className="kf-btn-primary">
              Add Record
            </button>
          </div>
        </form>
      </div>

      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Paddock</th>
              <th>Livestock Group</th>
              <th>Start</th>
              <th>End</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {records.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  No grazing records yet.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id}>
                <td className="font-medium">{r.paddockName}</td>
                <td>{r.groupName ?? "—"}</td>
                <td>{formatDate(r.startDate)}</td>
                <td>{r.endDate ? formatDate(r.endDate) : "Ongoing"}</td>
                <td>{r.notes ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
