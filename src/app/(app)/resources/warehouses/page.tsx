import Link from "next/link";
import { db, schema } from "@/db";
import { PageHeader } from "@/components/ui/page-header";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WarehousesPage() {
  const warehouses = await db.select().from(schema.warehouses);

  return (
    <div>
      <PageHeader
        title="Warehouses"
        actions={
          <Link href="/resources/warehouses/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Warehouse
          </Link>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {warehouses.length === 0 && <p className="text-gray-400 col-span-3 text-center py-10">No warehouses yet.</p>}
        {warehouses.map((w) => (
          <div key={w.id} className="kf-card p-4">
            <h3 className="font-semibold">{w.name}</h3>
            <p className="text-sm text-gray-500">{w.location ?? "No location set"}</p>
            {w.notes && <p className="text-sm text-gray-400 mt-2">{w.notes}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
