import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTRY } from "@/lib/money";

export default async function AdminDashboard() {
  const [productCount, customerCount, pendingOrders, allOrders, lowStock] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
    prisma.order.count({ where: { status: "PENDING" } }),
    prisma.order.findMany({
      take: 8,
      orderBy: { createdAt: "desc" },
      include: { user: true },
    }),
    prisma.product.findMany({
      where: { isActive: true },
      orderBy: { stockQuantity: "asc" },
      take: 5,
    }),
  ]);

  const cards = [
    { label: "Aktif ürün", value: productCount, href: "/admin/products" },
    { label: "Müşteri", value: customerCount, href: "/admin/customers" },
    { label: "Onay bekleyen sipariş", value: pendingOrders, href: "/admin/orders" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Genel Bakış</h1>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:border-slate-400 transition"
          >
            <div className="text-sm text-slate-500">{c.label}</div>
            <div className="text-3xl font-semibold mt-1">{c.value}</div>
          </Link>
        ))}
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Son siparişler</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Sipariş</th>
                <th>Müşteri</th>
                <th>Durum</th>
                <th className="text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {allOrders.length === 0 ? (
                <tr><td colSpan={4} className="py-4 text-slate-500">Henüz sipariş yok.</td></tr>
              ) : allOrders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="py-2">
                    <Link href={`/admin/orders/${o.id}`} className="text-slate-900 hover:underline">
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td>{o.user.email}</td>
                  <td><span className="inline-block text-xs bg-slate-100 px-2 py-0.5 rounded">{o.status}</span></td>
                  <td className="text-right">{formatTRY(o.grandTotal as any)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Stok azalan ürünler</h2>
        <ul className="text-sm divide-y divide-slate-100">
          {lowStock.map((p) => (
            <li key={p.id} className="py-2 flex justify-between">
              <span>{p.sku} — {p.name}</span>
              <span className="text-slate-500">stok: {p.stockQuantity}, rezerve: {p.reservedQuantity}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
