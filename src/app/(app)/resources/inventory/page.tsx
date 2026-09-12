import Link from "next/link";
import { db, schema } from "@/db";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatMoney, formatNumber } from "@/lib/format";
import { Plus, Bell } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await db.select().from(schema.inventoryItems).orderBy(asc(schema.inventoryItems.name));

  return (
    <div>
      <PageHeader
        title="Inventory"
        actions={
          <Link href="/resources/inventory/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> New Inventory Type
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Variety</th>
              <th>Category</th>
              <th>Available</th>
              <th>Est. Value</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  No inventory items yet.
                </td>
              </tr>
            )}
            {items.map((item) => {
              const qty = parseFloat(item.quantityAvailable);
              const low = item.reorderThreshold ? qty <= parseFloat(item.reorderThreshold) : false;
              const estValue = item.estValuePerUnit ? qty * parseFloat(item.estValuePerUnit) : null;
              return (
                <tr key={item.id}>
                  <td>
                    <Link href={`/resources/inventory/${item.id}`} className="font-medium text-[--color-primary] hover:underline">
                      {item.name}
                    </Link>
                  </td>
                  <td>{item.variety ?? "—"}</td>
                  <td>{item.category ?? "—"}</td>
                  <td>
                    <span className="flex items-center gap-1.5">
                      {low && <Bell size={13} className="text-[--color-danger]" />}
                      {formatNumber(qty)} {item.unit}
                    </span>
                  </td>
                  <td>{estValue !== null ? formatMoney(estValue) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
