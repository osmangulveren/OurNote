import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTRY } from "@/lib/money";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      customerProfile: true,
      orders: { select: { grandTotal: true, status: true } },
      customPrices: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Müşteriler</h1>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Ad / Firma</th>
              <th className="px-4 py-2 text-right">İskonto</th>
              <th className="px-4 py-2 text-right">Özel Fiyat</th>
              <th className="px-4 py-2 text-right">Sipariş</th>
              <th className="px-4 py-2 text-right">Ciro</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-4 text-slate-500">Henüz müşteri yok.</td></tr>
            ) : customers.map((c) => {
              const validOrders = c.orders.filter((o) => o.status !== "CANCELLED");
              const total = validOrders.reduce((s, o) => s + Number(o.grandTotal as any), 0);
              const discount = c.customerProfile?.discountPercentage ? Number(c.customerProfile.discountPercentage) : 0;
              return (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{c.email}</td>
                  <td className="px-4 py-2">
                    <div>{c.name ?? "—"}</div>
                    <div className="text-xs text-slate-500">{c.customerProfile?.companyName ?? "—"}</div>
                  </td>
                  <td className="px-4 py-2 text-right">{discount > 0 ? `%${discount}` : "—"}</td>
                  <td className="px-4 py-2 text-right">{c.customPrices.length > 0 ? `${c.customPrices.length} ürün` : "—"}</td>
                  <td className="px-4 py-2 text-right">{validOrders.length}</td>
                  <td className="px-4 py-2 text-right">{formatTRY(total)}</td>
                  <td className="px-4 py-2 text-right">
                    <Link href={`/admin/customers/${c.id}`} className="text-slate-700 hover:underline text-xs">Aç →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
