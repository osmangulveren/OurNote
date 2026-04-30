import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireSession();
  const userRole = (session.user as any).role as Role;
  if (userRole !== role) {
    redirect(userRole === "ADMIN" ? "/admin" : "/customer");
  }
  return session;
}

export async function requireAdmin() {
  return requireRole("ADMIN");
}

export async function requireCustomer() {
  return requireRole("CUSTOMER");
}
