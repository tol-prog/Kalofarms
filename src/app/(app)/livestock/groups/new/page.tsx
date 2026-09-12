import { PageHeader } from "@/components/ui/page-header";
import { createLivestockGroup } from "@/lib/actions/livestock-actions";

export default function NewLivestockGroupPage() {
  return (
    <div>
      <PageHeader title="Add Livestock Group" />
      <form action={createLivestockGroup} className="kf-card p-6 max-w-md space-y-4">
        <div>
          <label className="kf-label">Name</label>
          <input name="name" required className="kf-input" />
        </div>
        <div>
          <label className="kf-label">Type</label>
          <select name="type" className="kf-input" defaultValue="set">
            <option value="set">Set (manually assigned)</option>
            <option value="smart">Smart (criteria-based)</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary">
            Create Group
          </button>
        </div>
      </form>
    </div>
  );
}
