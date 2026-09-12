import { LoginForm } from "./login-form";
import { Leaf } from "lucide-react";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[--color-app-bg] px-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2 mb-6">
          <Leaf className="text-[--color-primary]" size={28} />
          <span className="text-2xl font-semibold tracking-tight">Kalo Farm</span>
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
