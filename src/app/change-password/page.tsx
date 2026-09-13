import { db, schema } from "@/db";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth";
import { KALO_LOGO_DATA_URL } from "@/lib/logo";
import { ChangePasswordForm } from "./change-password-form";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const session = await requireUser();
  const [user] = await db
    .select({ mustChangePassword: schema.users.mustChangePassword })
    .from(schema.users)
    .where(eq(schema.users.id, session.userId))
    .limit(1);
  const forced = user?.mustChangePassword ?? false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-app-bg] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center gap-1 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={KALO_LOGO_DATA_URL} alt="Kalo Farms" className="h-12 w-auto" />
          <span className="text-2xl font-semibold tracking-tight">Kalo Farms</span>
        </div>
        <div className="kf-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold mb-1">{forced ? "Set a new password" : "Change password"}</h1>
          <p className="text-sm text-gray-500 mb-5">
            {forced
              ? "For security, you need to set your own password before continuing."
              : "Update the password for your account."}
          </p>
          <ChangePasswordForm forced={forced} />
        </div>
      </div>
    </div>
  );
}
