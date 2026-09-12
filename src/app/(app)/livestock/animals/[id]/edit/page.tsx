import { notFound } from "next/navigation";
import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { AnimalForm } from "../../animal-form";
import { updateLivestock } from "@/lib/actions/livestock-actions";

export default async function EditAnimalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [animal] = await db.select().from(schema.livestock).where(eq(schema.livestock.id, id)).limit(1);
  if (!animal) notFound();

  const boundUpdate = updateLivestock.bind(null, id);

  return (
    <div>
      <PageHeader title={`Edit ${animal.nameOrLabel}`} />
      <AnimalForm animal={animal} action={boundUpdate} />
    </div>
  );
}
