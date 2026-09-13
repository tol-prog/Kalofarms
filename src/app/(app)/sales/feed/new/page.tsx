import Link from "next/link";
import { db, schema } from "@/db";
import { eq, asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { getFeedInventoryItems, logFeedSale } from "@/lib/actions/sales-actions";
import { FeedSaleForm } from "./feed-sale-form";

export const dynamic = "force-dynamic";

export default async function FeedSalePage() {
  const [items, categories] = await Promise.all([
    getFeedInventoryItems(),
    db
      .select()
      .from(schema.accountingCategories)
      .where(eq(schema.accountingCategories.type, "income"))
      .orderBy(asc(schema.accountingCategories.name)),
  ]);

  return (
    <div className="max-w-xl">
      <PageHeader title="Feed Sale" description="Sells from a specific finished feed type." />
      {items.length === 0 ? (
        <div className="kf-card p-8 text-center text-gray-400">
          No finished feed types yet.{" "}
          <Link href="/resources/feed-types" className="text-[--color-primary] font-medium">
            Set one up
          </Link>{" "}
          first.
        </div>
      ) : (
        <div className="kf-card p-5">
          <FeedSaleForm
            action={logFeedSale}
            items={items.map((i) => ({ id: i.id, name: i.name, unit: i.unit, quantityAvailable: i.quantityAvailable }))}
            categories={categories.map((c) => ({ id: c.id, name: c.name }))}
          />
        </div>
      )}
    </div>
  );
}
