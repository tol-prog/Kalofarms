import Link from "next/link";
import { db, schema } from "@/db";
import { asc } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { toggleUserDisabled } from "@/lib/actions/user-actions";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsersSettingsPage() {
  const session = await requireUser();
  const users = await db.select().from(schema.users).orderBy(asc(schema.users.createdAt));

  return (
    <div>
      <PageHeader
        title="Users"
        actions={
          session.role === "admin" ? (
            <Link href="/settings/users/new" className="kf-btn-primary flex items-center gap-1.5">
              <Plus size={15} /> New User
            </Link>
          ) : undefined
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Display Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Last Login</th>
              <th>Status</th>
              {session.role === "admin" && <th></th>}
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td className="font-medium">
                  {u.displayName} {u.id === session.userId && <Badge className="ml-1">You</Badge>}
                </td>
                <td>{u.email}</td>
                <td className="capitalize">{u.role.replace("_", " ")}</td>
                <td>{u.lastLoginAt ? formatDate(u.lastLoginAt) : "Never"}</td>
                <td>
                  <Badge variant={u.disabled ? "danger" : "active"}>{u.disabled ? "Disabled" : "Active"}</Badge>
                </td>
                {session.role === "admin" && (
                  <td>
                    {u.id !== session.userId && (
                      <form action={toggleUserDisabled.bind(null, u.id, !u.disabled)}>
                        <button type="submit" className="text-xs text-[--color-primary] font-medium">
                          {u.disabled ? "Enable" : "Disable"}
                        </button>
                      </form>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
