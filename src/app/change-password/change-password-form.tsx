"use client";

import { useActionState } from "react";
import { changePasswordAction } from "@/lib/actions/auth-actions";

export function ChangePasswordForm({ forced }: { forced: boolean }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div>
        <label className="kf-label" htmlFor="currentPassword">
          {forced ? "Temporary password" : "Current password"}
        </label>
        <input
          id="currentPassword"
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          className="kf-input"
        />
      </div>
      <div>
        <label className="kf-label" htmlFor="newPassword">
          New password
        </label>
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="kf-input"
        />
      </div>
      <div>
        <label className="kf-label" htmlFor="confirmPassword">
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className="kf-input"
        />
      </div>
      {state?.error && (
        <p className="text-sm rounded-md px-3 py-2" style={{ background: "var(--color-danger-bg)", color: "var(--color-danger)" }}>
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="kf-btn-primary w-full py-2.5">
        {pending ? "Saving…" : "Save new password"}
      </button>
    </form>
  );
}
