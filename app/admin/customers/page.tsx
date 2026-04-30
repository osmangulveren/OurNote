import { prisma } from "@/lib/prisma";
import { formatTRY } from "@/lib/money";

export default async function AdminCustomersPage() {
  const customers = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    include: {
      customerProfile: true,
      orders: { select: { grandTotal: true, status: true } },
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
              <th className="px-4 py-2">Ad Soyad</th>
              <th className="px-4 py-2">Firma</th>
              <th className="px-4 py-2">VKN</th>
              <th className="px-4 py-2 text-right">Sipariş</th>
              <th className="px-4 py-2 text-right">Ciro</th>
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-4 text-slate-500">Henüz müşteri yok.</td></tr>
            ) : customers.map((c) => {
              const validOrders = c.orders.filter((o) => o.status !== "CANCELLED");
              const total = validOrders.reduce((s, o) => s + Number(o.grandTotal as any), 0);
              return (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2">{c.email}</td>
                  <td className="px-4 py-2">{c.name ?? "—"}</td>
                  <td className="px-4 py-2">{c.customerProfile?.companyName ?? "—"}</td>
                  <td className="px-4 py-2">{c.customerProfile?.taxNumber ?? "—"}</td>
                  <td className="px-4 py-2 text-right">{validOrders.length}</td>
                  <td className="px-4 py-2 text-right">{formatTRY(total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
