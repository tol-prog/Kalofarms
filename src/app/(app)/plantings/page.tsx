import Link from "next/link";
import { db, schema } from "@/db";
import { desc, eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/format";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PlantingsPage() {
  const plantings = await db
    .select({
      id: schema.plantings.id,
      fieldLocation: schema.plantings.fieldLocation,
      areaSize: schema.plantings.areaSize,
      areaUnit: schema.plantings.areaUnit,
      status: schema.plantings.status,
      plantedDate: schema.plantings.plantedDate,
      expectedHarvestDate: schema.plantings.expectedHarvestDate,
      cropName: schema.cropTypes.name,
    })
    .from(schema.plantings)
    .leftJoin(schema.cropTypes, eq(schema.cropTypes.id, schema.plantings.cropTypeId))
    .orderBy(desc(schema.plantings.createdAt));

  return (
    <div>
      <PageHeader
        title="Plantings"
        actions={
          <Link href="/plantings/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Planting
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Crop</th>
              <th>Field / Location</th>
              <th>Area</th>
              <th>Planted</th>
              <th>Expected Harvest</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {plantings.length === 0 && (
              <tr>
                <td colSpan={6} className="text-center text-gray-400 py-10">
                  No plantings recorded yet.
                </td>
              </tr>
            )}
            {plantings.map((p) => (
              <tr key={p.id}>
                <td>
                  <Link href={`/plantings/${p.id}`} className="font-medium text-[--color-primary] hover:underline">
                    {p.cropName ?? "Unspecified Crop"}
                  </Link>
                </td>
                <td>{p.fieldLocation ?? "—"}</td>
                <td>{p.areaSize ? `${formatNumber(p.areaSize)} ${p.areaUnit}` : "—"}</td>
                <td>{p.plantedDate ? formatDate(p.plantedDate) : "—"}</td>
                <td>{p.expectedHarvestDate ? formatDate(p.expectedHarvestDate) : "—"}</td>
                <td>
                  <Badge variant={statusVariant(p.status)}>{p.status}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
