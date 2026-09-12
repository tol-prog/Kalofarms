import { requireUser } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Sidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <Topbar displayName={session.displayName} role={session.role} />
        <main className="flex-1 overflow-y-auto p-6" style={{ background: "var(--color-app-bg)" }}>
          {children}
        </main>
      </div>
    </div>
  );
}
