import Link from "next/link";
import { notFound } from "next/navigation";
import { OrderStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { formatTRY, formatPercent } from "@/lib/money";
import { updateOrderStatus } from "@/lib/orders/actions";
import { createInvoiceDraft } from "@/lib/invoices/actions";

const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["APPROVED", "CANCELLED"],
  APPROVED: ["PREPARING", "CANCELLED"],
  PREPARING: ["SHIPPED", "CANCELLED"],
  SHIPPED: [],
  CANCELLED: [],
};

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      user: { include: { customerProfile: true } },
      invoice: true,
      stockMovements: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const allowed = TRANSITIONS[order.status];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">{order.createdAt.toLocaleString("tr-TR")}</p>
        </div>
        <Link href="/admin/orders" className="text-sm text-slate-600 hover:underline">← Tüm siparişler</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Sipariş Kalemleri</h2>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">SKU</th>
                <th>Ürün</th>
                <th className="text-right">Miktar</th>
                <th className="text-right">Birim Fiyat</th>
                <th className="text-right">KDV</th>
                <th className="text-right">Toplam</th>
              </tr>
            </thead>
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

        <aside className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-semibold mb-2">Müşteri</h3>
            <p className="text-sm">{order.user.name ?? "—"}</p>
            <p className="text-sm text-slate-500">{order.user.email}</p>
            {order.user.customerProfile ? (
              <div className="text-sm text-slate-600 mt-2">
                <p>{order.user.customerProfile.companyName}</p>
                {order.user.customerProfile.taxNumber && <p>VKN: {order.user.customerProfile.taxNumber}</p>}
                {order.user.customerProfile.phone && <p>{order.user.customerProfile.phone}</p>}
              </div>
            ) : null}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-semibold mb-2">Durum</h3>
            <div className="text-sm mb-3">
              Mevcut: <span className="inline-block text-xs bg-slate-900 text-white px-2 py-0.5 rounded">{order.status}</span>
            </div>
            {allowed.length === 0 ? (
              <p className="text-xs text-slate-500">Sipariş tamamlandı/iptal edildi.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {allowed.map((next) => (
                  <form
                    key={next}
                    action={async () => {
                      "use server";
                      await updateOrderStatus(order.id, next);
                    }}
                  >
                    <button className="w-full text-sm border border-slate-300 hover:bg-slate-50 rounded-lg px-3 py-2">
                      → {next}
                    </button>
                  </form>
                )) }
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-semibold mb-2">Fatura</h3>
            {order.invoice ? (
              <Link
                href={`/invoices/${order.invoice.id}`}
                className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                Taslak: {order.invoice.invoiceNumber}
              </Link>
            ) : (
              <form
                action={async () => {
                  "use server";
                  await createInvoiceDraft(order.id);
                }}
              >
                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-2 text-sm">
                  Taslak fatura oluştur
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold mb-3">Stok Hareketleri</h3>
        {order.stockMovements.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz hareket yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500">
              <tr><th>Tarih</th><th>Tip</th><th className="text-right">Miktar</th><th>Not</th></tr>
            </thead>
            <tbody>
              {order.stockMovements.map((m) => (
                <tr key={m.id} className="border-t border-slate-100">
                  <td className="py-1.5">{m.createdAt.toLocaleString("tr-TR")}</td>
                  <td>{m.type}</td>
                  <td className="text-right">{m.quantity}</td>
                  <td className="text-slate-600">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
