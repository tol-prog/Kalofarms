import Link from "next/link";
import { db, schema } from "@/db";
import { asc } from "drizzle-orm";
import { PageHeader } from "@/components/ui/page-header";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const contacts = await db.select().from(schema.contacts).orderBy(asc(schema.contacts.name));

  return (
    <div>
      <PageHeader
        title="Contacts"
        actions={
          <Link href="/contacts/new" className="kf-btn-primary flex items-center gap-1.5">
            <Plus size={15} /> Add Contact
          </Link>
        }
      />
      <div className="kf-card overflow-x-auto">
        <table className="w-full kf-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {contacts.length === 0 && (
              <tr>
                <td colSpan={4} className="text-center text-gray-400 py-10">
                  No contacts yet.
                </td>
              </tr>
            )}
            {contacts.map((c) => (
              <tr key={c.id}>
                <td className="font-medium">{c.name}</td>
                <td>
                  <Badge>{c.type}</Badge>
                </td>
                <td>{c.email ?? "—"}</td>
                <td>{c.phone ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
