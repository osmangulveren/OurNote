"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createSession, destroySession } from "@/lib/auth";
import { ALL_COUNTRIES } from "@/lib/config";
import { db } from "@/lib/db";

export type FormState = { error?: string } | undefined;

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  const password = String(form.get("password") ?? "");
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }
  await createSession(user.id);
  const next = String(form.get("next") ?? "");
  redirect(user.role === "ADMIN" ? "/admin" : next.startsWith("/") ? next : "/catalog");
}

const RegisterSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  companyName: z.string().trim().min(2, "Please enter your company name"),
  vatNumber: z.string().trim().optional(),
  country: z.string().refine((c) => c in ALL_COUNTRIES, "Please choose a country"),
  city: z.string().trim().min(1, "Please enter a city"),
  address: z.string().trim().min(3, "Please enter an address"),
  postalCode: z.string().trim().min(2, "Please enter a postal code"),
  phone: z.string().trim().min(5, "Please enter a phone number"),
});

export async function register(_: FormState, form: FormData): Promise<FormState> {
  const parsed = RegisterSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid form" };
  const d = parsed.data;
  if (await db.user.findUnique({ where: { email: d.email } })) {
    return { error: "An account with this email already exists." };
  }
  const user = await db.user.create({
    data: {
      email: d.email,
      name: d.name,
      passwordHash: await bcrypt.hash(d.password, 10),
      company: {
        create: {
          name: d.companyName,
          vatNumber: d.vatNumber?.replace(/\s+/g, "").toUpperCase() || null,
          country: d.country,
          city: d.city,
          address: d.address,
          postalCode: d.postalCode,
          phone: d.phone,
        },
      },
    },
  });
  await createSession(user.id);
  redirect("/account?welcome=1");
}

export async function logout() {
  await destroySession();
  redirect("/");
}
