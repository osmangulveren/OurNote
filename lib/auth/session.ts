import { auth } from "@/auth";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";
import { hasPermission, isAdminRole, type Permission } from "./permissions";

export async function requireSession() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return session;
}

export async function requireAdmin() {
  const session = await requireSession();
  const role = (session.user as any).role as Role;
  if (!isAdminRole(role)) {
    redirect("/customer");
  }
  return session;
}

export async function requireCustomer() {
  const session = await requireSession();
  const role = (session.user as any).role as Role;
  if (role !== "CUSTOMER") {
    redirect("/admin");
  }
  return session;
}

export async function requirePermission(perm: Permission) {
  const session = await requireSession();
  const role = (session.user as any).role as Role;
  if (!hasPermission(role, perm)) {
    redirect(isAdminRole(role) ? "/admin" : "/customer");
  }
  return session;
}
