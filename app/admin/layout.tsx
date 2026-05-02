import { requireAdmin } from "@/lib/auth/session";
import AppShell from "@/components/AppShell";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import type { Role } from "@prisma/client";

const NAV: Array<{ href: string; label: string; perm?: Permission }> = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/products", label: "Ürünler", perm: "products.read" },
  { href: "/admin/orders", label: "Siparişler", perm: "orders.read" },
  { href: "/admin/customers", label: "Müşteriler", perm: "customers.read" },
  { href: "/admin/conversations", label: "Asistan", perm: "conversations.read" },
  { href: "/admin/warehouses", label: "Depolar", perm: "warehouses.manage" },
  { href: "/admin/accounting", label: "Ön Muhasebe", perm: "accounting.read" },
  { href: "/admin/audit", label: "Audit Log", perm: "audit.read" },
  { href: "/admin/users", label: "Personel", perm: "users.manage" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const role = (session.user as any).role as Role;
  const nav = NAV.filter((n) => !n.perm || hasPermission(role, n.perm));
  return (
    <AppShell title="Rosadore Home · Admin" user={session.user as any} nav={nav}>
      {children}
    </AppShell>
  );
}
