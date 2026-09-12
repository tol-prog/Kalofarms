import Link from "next/link";
import { db, schema } from "@/db";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AccountingCategoriesPage() {
  const categories = await db.select().from(schema.accountingCategories).orderBy(asc(schema.accountingCategories.name));

  return (
    <div>
      <PageHeader
        title="Accounting Categories"
        description="Chart of Accounts"
        actions={
          <Link href="/accounting/categories/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Category
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Tax Line</th>
            </tr>
          </thead>
          <tbody>
            {categories.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-gray-400 py-10">
                  No accounting categories yet.
                </td>
              </tr>
            )}
            {categories.map((c) => (
              <tr key={c.id}>
                <td>
                  <p className="font-medium">{c.name}</p>
                  {c.description && <p className="text-xs text-gray-400">{c.description}</p>}
                </td>
                <td>
                  <Badge variant={c.type === "income" ? "active" : "muted"}>{c.type}</Badge>
                </td>
                <td>{c.taxLine ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
