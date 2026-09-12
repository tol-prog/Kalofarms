import { PageHeader } from "@/components/ui/page-header";
import { AnimalForm } from "../animal-form";
import { createLivestock } from "@/lib/actions/livestock-actions";

export default function NewAnimalPage() {
  return (
    <div>
      <PageHeader title="Add Animal" />
      <AnimalForm action={createLivestock} />
    </div>
  );
}
