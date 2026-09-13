import Link from "next/link";
import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq, desc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Badge, statusVariant } from "@/components/ui/badge";
import { formatDate, formatNumber } from "@/lib/format";
import { recordActivity, deleteLivestock } from "@/lib/actions/livestock-actions";
import { RecordActivityForm } from "./record-activity-form";
import { Pencil, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

const VALID_TYPES = [
  "note",
  "change_count",
  "harvest",
  "weight",
  "feeding",
  "treatment",
  "wellness",
  "birth",
] as const;

export default async function AnimalDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ type?: string }>;
}) {
  const { id } = await params;
  const { type } = await searchParams;
  const defaultType = (VALID_TYPES as readonly string[]).includes(type ?? "") ? (type as (typeof VALID_TYPES)[number]) : "note";

  const [animal] = await db.select().from(schema.livestock).where(eq(schema.livestock.id, id)).limit(1);
  if (!animal) notFound();

  const activity = await db
    .select()
    .from(schema.livestockActivity)
    .where(eq(schema.livestockActivity.livestockId, id))
    .orderBy(desc(schema.livestockActivity.date), desc(schema.livestockActivity.createdAt))
    .limit(30);

  const boundRecordActivity = recordActivity.bind(null, id);
  const boundDelete = deleteLivestock.bind(null, id);

  return (
    <div>
      <PageHeader
        title={animal.nameOrLabel}
        description={`${animal.animalType}${animal.breed ? " · " + animal.breed : ""}${animal.numberInSet > 1 ? ` · ${formatNumber(animal.numberInSet)} in set` : ""}`}
        actions={
          <>
            <Badge variant={statusVariant(animal.status)}>{animal.status}</Badge>
            <Link href={`/livestock/animals/${id}/edit`} className="kf-btn-secondary flex items-center gap-1.5">
              <Pencil size={14} /> Edit
            </Link>
            <form action={boundDelete}>
              <button type="submit" className="kf-btn-secondary flex items-center gap-1.5 text-[--color-danger]">
                <Trash2 size={14} /> Delete
              </button>
            </form>
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="kf-card p-5">
            <h2 className="text-sm font-semibold mb-3">Basic Information</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <Detail label="Internal ID" value={animal.internalId} />
              <Detail label="Animal Type" value={animal.animalType} />
              <Detail label="Tag Number" value={animal.tagNumber} />
              <Detail label="Gender" value={animal.gender} />
              <Detail label="Number in Set" value={formatNumber(animal.numberInSet)} />
              <Detail label="Location / Paddock" value={animal.locationPaddock} />
              <Detail label="Last Weight (kg)" value={animal.lastWeight} />
              <Detail label="Wellness Score" value={animal.wellnessScore} />
            </dl>
          </div>

          <div className="kf-card p-5">
            <h2 className="text-sm font-semibold mb-3">Birth &amp; Acquisition</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <Detail label="Method Acquired" value={animal.methodAcquired?.replace("_", " ")} />
              <Detail label="Purchase Date" value={animal.purchaseDate ? formatDate(animal.purchaseDate) : null} />
              <Detail label="Birth Date" value={animal.birthDate ? formatDate(animal.birthDate) : null} />
              <Detail
                label="Estimated Break-Even"
                value={animal.estimatedBreakEven ? `ETB ${formatNumber(animal.estimatedBreakEven)}` : null}
              />
            </dl>
            {animal.notes && (
              <>
                <h3 className="text-xs font-semibold uppercase text-gray-500 mt-4 mb-1">Notes</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{animal.notes}</p>
              </>
            )}
          </div>

          <div className="kf-card p-5" id="record-activity">
            <h2 className="text-sm font-semibold mb-3">Record Activity</h2>
            <RecordActivityForm action={boundRecordActivity} defaultType={defaultType} />
          </div>
        </div>

        <div className="kf-card p-5 h-fit">
          <h2 className="text-sm font-semibold mb-3">Recent Activity</h2>
          {activity.length === 0 ? (
            <p className="text-sm text-gray-400">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-3">
              {activity.map((a) => (
                <li key={a.id} className="text-sm border-b pb-2 last:border-0" style={{ borderColor: "var(--color-card-border)" }}>
                  <p className="text-xs text-gray-400">{formatDate(a.date)}</p>
                  <p className="font-medium capitalize">{a.type.replace("_", " ")}</p>
                  {a.deceasedCount ? <p className="text-gray-600">{a.deceasedCount} deceased</p> : null}
                  {a.regularEggs || a.oversizedEggs || a.brokenEggs ? (
                    <p className="text-gray-600">
                      {formatNumber(a.regularEggs ?? 0)} regular &middot; {formatNumber(a.oversizedEggs ?? 0)} oversized &middot;{" "}
                      <span style={{ color: "var(--color-danger)" }}>{formatNumber(a.brokenEggs ?? 0)} broken</span>
                    </p>
                  ) : a.yieldAmount ? (
                    <p className="text-gray-600">
                      Yield {a.yieldAmount} {a.yieldUnit}
                    </p>
                  ) : null}
                  {a.weight ? <p className="text-gray-600">Weight {a.weight} kg</p> : null}
                  {a.treatmentName ? (
                    <p className="text-gray-600">
                      {a.treatmentName}
                      {a.withdrawalUntil ? ` · withdrawal until ${formatDate(a.withdrawalUntil)}` : ""}
                    </p>
                  ) : null}
                  {a.notes ? <p className="text-gray-500 italic">{a.notes}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | number | null | undefined }) {
  return (
    <>
      <dt className="text-gray-500">{label}</dt>
      <dd className="font-medium">{value ?? "—"}</dd>
    </>
  );
}
