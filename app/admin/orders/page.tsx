import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTRY } from "@/lib/money";

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { user: true, invoice: true },
    take: 100,
  });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Siparişler</h1>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">Sipariş No</th>
              <th className="px-4 py-2">Tarih</th>
              <th className="px-4 py-2">Müşteri</th>
              <th className="px-4 py-2">Durum</th>
              <th className="px-4 py-2">Fatura</th>
              <th className="px-4 py-2 text-right">Tutar</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-4 text-slate-500">Henüz sipariş yok.</td></tr>
            ) : orders.map((o) => (
              <tr key={o.id} className="border-t border-slate-100">
                <td className="px-4 py-2">
                  <Link href={`/admin/orders/${o.id}`} className="hover:underline font-medium">{o.orderNumber}</Link>
                </td>
                <td className="px-4 py-2 text-slate-600">{o.createdAt.toLocaleString("tr-TR")}</td>
                <td className="px-4 py-2">{o.user.email}</td>
                <td className="px-4 py-2"><span className="inline-block text-xs bg-slate-100 px-2 py-0.5 rounded">{o.status}</span></td>
                <td className="px-4 py-2 text-xs">
                  {o.invoice ? (
                    <Link href={`/invoices/${o.invoice.id}`} className="text-emerald-700 hover:underline">{o.invoice.invoiceNumber}</Link>
                  ) : <span className="text-slate-400">—</span>}
                </td>
                <td className="px-4 py-2 text-right">{formatTRY(o.grandTotal as any)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
