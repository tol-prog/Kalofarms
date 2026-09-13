import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { getLayerBatches, getLastHarvestBatchId, logLayerHarvest } from "@/lib/actions/livestock-actions";
import { HarvestForm } from "./harvest-form";

export const dynamic = "force-dynamic";

export default async function LayerHarvestPage() {
  const [batches, lastBatchId] = await Promise.all([getLayerBatches(), getLastHarvestBatchId()]);

  return (
    <div className="max-w-xl">
      <PageHeader title="Log Today's Harvest" description="Regular, oversized & broken eggs for a layer batch." />

      {batches.length === 0 ? (
        <div className="kf-card p-8 text-center text-gray-400">
          No active chicken batches yet.{" "}
          <Link href="/livestock/animals/new" className="text-[--color-primary] font-medium">
            Add a batch
          </Link>
          .
        </div>
      ) : (
        <div className="kf-card p-5">
          <HarvestForm
            action={logLayerHarvest}
            batches={batches.map((b) => ({ id: b.id, nameOrLabel: b.nameOrLabel, numberInSet: b.numberInSet }))}
            defaultBatchId={lastBatchId}
          />
        </div>
      )}
    </div>
  );
}
