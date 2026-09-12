import { requireAdmin } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { createUser } from "@/lib/actions/user-actions";

export default async function NewUserPage() {
  await requireAdmin();

  return (
    <div>
      <PageHeader title="New User" />
      <form action={createUser} className="kf-card p-6 max-w-md space-y-4">
        <div>
          <label className="kf-label">Display Name</label>
          <input name="displayName" required className="kf-input" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="kf-label">First Name</label>
            <input name="firstName" className="kf-input" />
          </div>
          <div>
            <label className="kf-label">Last Name</label>
            <input name="lastName" className="kf-input" />
          </div>
        </div>
        <div>
          <label className="kf-label">Email</label>
          <input type="email" name="email" required className="kf-input" />
        </div>
        <div>
          <label className="kf-label">Temporary Password</label>
          <input type="text" name="password" required className="kf-input" />
        </div>
        <div>
          <label className="kf-label">Role</label>
          <select name="role" className="kf-input" defaultValue="staff">
            <option value="admin">Admin</option>
            <option value="operations_manager">Operations Manager</option>
            <option value="staff">Staff</option>
          </select>
        </div>
        <div className="flex justify-end">
          <button type="submit" className="kf-btn-primary">
            Create User
          </button>
        </div>
      </form>
    </div>
  );
}
