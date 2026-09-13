import { LoginForm } from "./login-form";
import { KALO_LOGO_DATA_URL } from "@/lib/logo";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-app-bg] px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center gap-1 mb-6">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={KALO_LOGO_DATA_URL} alt="Kalo Farms" className="h-12 w-auto" />
          <span className="text-2xl font-semibold tracking-tight">Kalo Farms</span>
        </div>
        <div className="kf-card p-6 shadow-sm">
          <h1 className="text-lg font-semibold mb-1">Sign in</h1>
          <p className="text-sm text-gray-500 mb-5">Kalo Farm PLC &mdash; Holeta, Oromia</p>
          <LoginForm next={next ?? "/dashboard"} />
        </div>
      </div>
    </div>
  );
}
