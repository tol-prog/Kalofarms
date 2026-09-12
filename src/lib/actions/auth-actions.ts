"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";

export async function loginAction(
  _prevState: { error?: string } | undefined,
  formData: FormData
): Promise<{ error?: string }> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const next = String(formData.get("next") || "/dashboard");

  if (!email || !password) {
    return { error: "Please enter both email and password." };
  }

  const result = await login(email, password);
  if (!result.ok) {
    return { error: result.error };
  }

  redirect(next || "/dashboard");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}
