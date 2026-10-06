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
  ["/admin/samples", "Swatch kits"],
  ["/admin/claims", "Claims"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const [pending, samples, claims] = await Promise.all([
    db.company.count({ where: { status: "PENDING" } }),
    db.sampleRequest.count({ where: { status: "REQUESTED" } }),
    db.claim.count({ where: { status: "OPEN" } }),
  ]);
  const counts: Record<string, number> = { "/admin/customers": pending, "/admin/samples": samples, "/admin/claims": claims };
  return (
    <div className="container-page grid gap-8 pb-8 pt-24 md:pt-28 lg:grid-cols-[200px_1fr]">
      <aside className="print:hidden">
        <div className="label mb-3">Admin</div>
        <nav className="flex gap-1 overflow-x-auto lg:flex-col">
          {nav.map(([href, label]) => (
            <Link key={href} href={href} className="flex items-center justify-between whitespace-nowrap rounded-full px-3 py-2 text-sm hover:bg-ink/5">
              {label}
              {counts[href] > 0 && <span className="badge bg-clay text-paper">{counts[href]}</span>}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="min-w-0">{children}</div>
    </div>
  );
}
