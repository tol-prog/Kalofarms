import Link from "next/link";
import { db, schema } from "@/db";
import { desc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate, formatMoney } from "@/lib/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function EquipmentPage() {
  const equipment = await db.select().from(schema.equipment).orderBy(desc(schema.equipment.createdAt));

  return (
    <div>
      <PageHeader
        title="Equipment"
        actions={
          <Link href="/resources/equipment/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Equipment
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Make / Model</th>
              <th>Purchase Date</th>
              <th>Purchase Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {equipment.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">
                  No equipment recorded yet.
                </td>
              </tr>
            )}
            {equipment.map((e) => (
              <tr key={e.id}>
                <td className="font-medium">{e.name}</td>
                <td>{e.type ?? "—"}</td>
                <td>
                  {e.make ?? ""} {e.model ?? ""}
                </td>
                <td>{e.purchaseDate ? formatDate(e.purchaseDate) : "—"}</td>
                <td>{e.purchasePrice ? formatMoney(e.purchasePrice) : "—"}</td>
                <td>
                  <Badge variant={statusVariant(e.status)}>{e.status.replace("_", " ")}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
