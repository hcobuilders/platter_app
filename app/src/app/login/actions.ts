"use server";

import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";

export async function loginAction(formData: FormData) {
  const from = String(formData.get("from") ?? "/");
  try {
    await signIn("credentials", {
      email: formData.get("email"),
      password: formData.get("password"),
      redirectTo: from || "/",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/login?error=1&from=${encodeURIComponent(from)}`);
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}
