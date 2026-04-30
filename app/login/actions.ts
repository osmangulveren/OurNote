"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type LoginState = { error?: string };

export async function loginAction(_: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) return { error: "Email ve şifre zorunludur." };

  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (err) {
    if (err instanceof AuthError) {
      return { error: "Email veya şifre hatalı." };
    }
    throw err;
  }

  let target = "/customer";
  if (next && next.startsWith("/")) {
    target = next;
  } else {
    const user = await prisma.user.findUnique({ where: { email } });
    if (user?.role === "ADMIN") target = "/admin";
  }
  redirect(target);
}
