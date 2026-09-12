import Link from "next/link";
import { db, schema } from "@/db";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { formatMoney } from "@/lib/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  const products = await db.select().from(schema.products).orderBy(asc(schema.products.name));

  return (
    <div>
      <PageHeader
        title="Products"
        actions={
          <Link href="/market/products/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Product
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Retail Price</th>
              <th>Wholesale Price</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-gray-400 py-10">
                  No products yet.
                </td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id}>
                <td className="font-medium">{p.name}</td>
                <td>{p.sku ?? "—"}</td>
                <td>{p.category ?? "—"}</td>
                <td>{formatMoney(p.price)}</td>
                <td>{p.wholesalePrice ? formatMoney(p.wholesalePrice) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
