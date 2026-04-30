import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { formatTRY, formatPercent } from "@/lib/money";

export default async function CustomerOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await requireCustomer();
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: { items: true, invoice: true },
  });
  if (!order || order.userId !== session.user!.id) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">{order.createdAt.toLocaleString("tr-TR")} · Durum: {order.status}</p>
        </div>
        <Link href="/customer/orders" className="text-sm text-slate-600 hover:underline">← Siparişlerim</Link>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500"><tr>
            <th className="py-2">SKU</th><th>Ürün</th>
            <th className="text-right">Miktar</th><th className="text-right">Birim Fiyat</th>
            <th className="text-right">KDV</th><th className="text-right">Toplam</th>
          </tr></thead>
          <tbody>
            {order.items.map((it) => (
              <tr key={it.id} className="border-t border-slate-100">
                <td className="py-2 font-mono text-xs">{it.sku}</td>
                <td>{it.productName}</td>
                <td className="text-right">{it.quantity} {it.unit}</td>
                <td className="text-right">{formatTRY(it.unitPrice as any)}</td>
                <td className="text-right">{formatPercent(it.vatRate as any)}</td>
                <td className="text-right">{formatTRY(it.lineTotal as any)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-sm">
            <tr><td colSpan={5} className="pt-3 text-right text-slate-500">Ara toplam</td><td className="pt-3 text-right">{formatTRY(order.subtotal as any)}</td></tr>
            <tr><td colSpan={5} className="text-right text-slate-500">KDV</td><td className="text-right">{formatTRY(order.vatTotal as any)}</td></tr>
            <tr><td colSpan={5} className="pt-1 text-right font-semibold">Genel Toplam</td><td className="pt-1 text-right font-semibold">{formatTRY(order.grandTotal as any)}</td></tr>
          </tfoot>
        </table>
      </section>

      {order.invoice ? (
        <Link href={`/invoices/${order.invoice.id}`} className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm">
          Fatura taslağını görüntüle
        </Link>
      ) : null}
    </div>
  );
}
