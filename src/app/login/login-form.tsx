"use client";

import { useActionState } from "react";
import { loginAction } from "@/lib/actions/auth-actions";

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label className="kf-label" htmlFor="email">
          Email
        </label>
        <input id="email" name="email" type="email" required className="kf-input" placeholder="you@kalofarms.et" />
      </div>
      <div>
        <label className="kf-label" htmlFor="password">
          Password
        </label>
        <input id="password" name="password" type="password" required className="kf-input" />
      </div>
      {state?.error && (
        <p className="text-sm rounded-md px-3 py-2" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="kf-btn-primary w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
