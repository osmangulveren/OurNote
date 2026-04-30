import { requireAdmin } from "@/lib/auth/session";
import AppShell from "@/components/AppShell";

const nav = [
  { href: "/admin", label: "Panel" },
  { href: "/admin/products", label: "Ürünler" },
  { href: "/admin/orders", label: "Siparişler" },
  { href: "/admin/customers", label: "Müşteriler" },
  { href: "/admin/accounting", label: "Ön Muhasebe" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  return (
    <AppShell title="B2B Tedarik · Admin" user={session.user as any} nav={nav}>
      {children}
    </AppShell>
  );
}
