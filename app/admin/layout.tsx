import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

const nav = [
  ["/admin", "Dashboard"],
  ["/admin/orders", "Orders"],
  ["/admin/shipments", "Trucks (TIR)"],
  ["/admin/products", "Products"],
  ["/admin/categories", "Categories"],
  ["/admin/import", "Import catalog"],
  ["/admin/customers", "Customers"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const pending = await db.company.count({ where: { status: "PENDING" } });
  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[200px_1fr]">
      <aside className="print:hidden">
        <div className="label mb-3">Admin</div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="flex items-center justify-between whitespace-nowrap rounded-lg px-3 py-2 text-sm hover:bg-slate-100">
              {label}
              {href === "/admin/customers" && pending > 0 && <span className="badge bg-accent-500 text-white">{pending}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
