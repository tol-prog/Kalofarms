import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  const [user] = await db
    .select({ mustChangePassword: schema.users.mustChangePassword })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);
  if (user?.mustChangePassword) redirect("/change-password");

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar role={session.role} />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar displayName={session.displayName} role={session.role} />
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6" style={{ background: "var(--color-app-bg)" }}>
          {children}
        </main>
        <MobileNav role={session.role} />
      </div>
    </div>
  );
}
