import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/format";
import { updatePlantingStatus } from "@/lib/actions/plantings-actions";

export const dynamic = "force-dynamic";

export default async function PlantingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [planting] = await db.select().from(schema.plantings).where(eq(schema.plantings.id, id)).limit(1);
  if (!planting) notFound();

  const cropType = planting.cropTypeId
    ? (await db.select().from(schema.cropTypes).where(eq(schema.cropTypes.id, planting.cropTypeId)).limit(1))[0]
    : null;

  const boundUpdate = updatePlantingStatus.bind(null, id);

  return (
    <div>
      <PageHeader
        title={cropType?.name ?? "Planting"}
        description={planting.fieldLocation ?? undefined}
        actions={<Badge variant={statusVariant(planting.status)}>{planting.status}</Badge>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="kf-card p-5">
          <h2 className="text-sm font-semibold mb-3">Details</h2>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-gray-500">Area</dt>
            <dd className="font-medium">
              {planting.areaSize ? `${formatNumber(planting.areaSize)} ${planting.areaUnit}` : "—"}
            </dd>
            <dt className="text-gray-500">Planted</dt>
            <dd className="font-medium">{planting.plantedDate ? formatDate(planting.plantedDate) : "—"}</dd>
            <dt className="text-gray-500">Expected Harvest</dt>
            <dd className="font-medium">
              {planting.expectedHarvestDate ? formatDate(planting.expectedHarvestDate) : "—"}
            </dd>
            <dt className="text-gray-500">Actual Harvest</dt>
            <dd className="font-medium">
              {planting.actualHarvestDate ? formatDate(planting.actualHarvestDate) : "—"}
            </dd>
            <dt className="text-gray-500">Expected Yield</dt>
            <dd className="font-medium">
              {planting.expectedYield ? `${formatNumber(planting.expectedYield)} ${planting.yieldUnit ?? ""}` : "—"}
            </dd>
            <dt className="text-gray-500">Actual Yield</dt>
            <dd className="font-medium">
              {planting.actualYield ? `${formatNumber(planting.actualYield)} ${planting.yieldUnit ?? ""}` : "—"}
            </dd>
          </dl>
          {planting.notes && <p className="text-sm text-gray-600 mt-3">{planting.notes}</p>}
        </div>

        <div className="kf-card p-5">
          <h2 className="text-sm font-semibold mb-3">Update Status</h2>
          <form action={boundUpdate} className="space-y-3">
            <div>
              <label className="kf-label">Status</label>
              <select name="status" className="kf-input" defaultValue={planting.status}>
                <option value="planned">Planned</option>
                <option value="planted">Planted</option>
                <option value="growing">Growing</option>
                <option value="harvested">Harvested</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div>
              <label className="kf-label">Actual Harvest Date</label>
              <input type="date" name="actualHarvestDate" className="kf-input" />
            </div>
            <div>
              <label className="kf-label">Actual Yield</label>
              <input type="number" step="0.01" name="actualYield" className="kf-input" />
            </div>
            <button type="submit" className="kf-btn-primary w-full">
              Save
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
