import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { formatTRY, formatPercent } from "@/lib/money";
import { PRODUCTION_STAGE_LABEL } from "@/lib/orders/productionStages";
import { PAYMENT_METHOD_LABEL } from "@/lib/orders/paymentMethods";
import OrderTimeline from "@/components/OrderTimeline";
import ShipmentMap from "@/components/ShipmentMap";

export default async function CustomerOrderDetailPage({ params }: { params: { id: string } }) {
  const session = await requireCustomer();
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      invoice: true,
      shipment: true,
      productionEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order || order.userId !== session.user!.id) notFound();

  const isCancelled = order.status === "CANCELLED";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{order.orderNumber}</h1>
          <p className="text-sm text-slate-500">
            {order.createdAt.toLocaleString("tr-TR")} · Durum: <span className="font-medium">{order.status}</span>
            {!isCancelled && order.productionStage !== "WAITING" ? (
              <> · Aşama: <span className="font-medium text-emerald-700">{PRODUCTION_STAGE_LABEL[order.productionStage]}</span></>
            ) : null}
          </p>
        </div>
        <Link href="/customer/orders" className="text-sm text-slate-600 hover:underline">← Siparişlerim</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <h2 className="font-semibold mb-3">Üretim & Sevk Takibi</h2>
          <OrderTimeline
            current={order.productionStage}
            events={order.productionEvents.map((e) => ({ stage: e.stage, createdAt: e.createdAt, note: e.note }))}
            cancelled={isCancelled}
          />
        </section>

        <aside className="space-y-4">
          {order.shipment ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2 text-sm">
              <h3 className="font-semibold">Sevkiyat</h3>
              <div><span className="text-slate-500">TIR Plakası:</span> <span className="font-mono">{order.shipment.truckPlate}</span></div>
              <div><span className="text-slate-500">Şoför:</span> {order.shipment.driverName}</div>
              {order.shipment.driverPhone ? (
                <div><span className="text-slate-500">Telefon:</span> <a href={`tel:${order.shipment.driverPhone}`} className="text-emerald-700 hover:underline">{order.shipment.driverPhone}</a></div>
              ) : null}
              {order.shipment.etaAt ? (
                <div><span className="text-slate-500">Tahmini Varış:</span> {new Date(order.shipment.etaAt).toLocaleString("tr-TR")}</div>
              ) : null}
              {order.shipment.departureAt ? (
                <div><span className="text-slate-500">Yola çıkış:</span> {new Date(order.shipment.departureAt).toLocaleString("tr-TR")}</div>
              ) : null}
              {order.shipment.deliveredAt ? (
                <div className="text-emerald-700">✓ Teslim edildi: {new Date(order.shipment.deliveredAt).toLocaleString("tr-TR")}</div>
              ) : null}
            </div>
          ) : null}

          {order.invoice ? (
            <Link href={`/invoices/${order.invoice.id}`} className="block bg-emerald-600 hover:bg-emerald-700 text-white text-sm rounded-lg px-3 py-2 text-center">
              Fatura taslağını görüntüle
            </Link>
          ) : null}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm">
            <h3 className="font-semibold mb-1">Ödeme Yöntemi</h3>
            <p>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
          </div>
        </aside>
      </div>

      {order.shipment && order.shipment.lastLat != null && order.shipment.lastLng != null ? (
        <section className="bg-white border border-slate-200 rounded-2xl p-5 space-y-2">
          <div className="flex items-baseline justify-between">
            <h3 className="font-semibold">Canlı Konum</h3>
            <span className="text-xs text-slate-500">
              Son güncelleme: {order.shipment.lastPingAt ? new Date(order.shipment.lastPingAt).toLocaleString("tr-TR") : "—"}
            </span>
          </div>
          <ShipmentMap
            lat={order.shipment.lastLat}
            lng={order.shipment.lastLng}
            label={`${order.shipment.truckPlate} · ${order.shipment.driverName}`}
          />
          <p className="text-[11px] text-slate-500">Konum şoför tarafından paylaşıldıkça otomatik günceller.</p>
        </section>
      ) : order.shipment ? (
        <p className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          Şoför henüz canlı konum paylaşmadı.
        </p>
      ) : null}

      <section className="bg-white border border-slate-200 rounded-2xl p-5 overflow-x-auto">
        <h3 className="font-semibold mb-3">Sipariş Kalemleri</h3>
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500"><tr>
            <th className="py-2">SKU</th><th>Ürün</th>
            <th className="text-right">Miktar</th><th className="text-right">Birim Fiyat</th>
            <th className="text-right">KDV</th><th className="text-right">Toplam</th>
          </tr></thead>
          <tbody>
            {order.items.map((it) => {
              const cfg = (it.configuration as any) ?? null;
              return (
                <tr key={it.id} className="border-t border-slate-100 align-top">
                  <td className="py-2 font-mono text-xs">{it.sku}</td>
                  <td>
                    <div>{it.productName}</div>
                    {cfg?.summary ? <div className="text-xs text-slate-500">{cfg.summary}</div> : null}
                  </td>
                  <td className="text-right">{it.quantity} {it.unit}</td>
                  <td className="text-right">{formatTRY(it.unitPrice as any)}</td>
                  <td className="text-right">{formatPercent(it.vatRate as any)}</td>
                  <td className="text-right">{formatTRY(it.lineTotal as any)}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="text-sm">
            <tr><td colSpan={5} className="pt-3 text-right text-slate-500">Ara toplam</td><td className="pt-3 text-right">{formatTRY(order.subtotal as any)}</td></tr>
            <tr><td colSpan={5} className="text-right text-slate-500">KDV</td><td className="text-right">{formatTRY(order.vatTotal as any)}</td></tr>
            <tr><td colSpan={5} className="pt-1 text-right font-semibold">Genel Toplam</td><td className="pt-1 text-right font-semibold">{formatTRY(order.grandTotal as any)}</td></tr>
          </tfoot>
        </table>
      </section>
    </div>
  );
}
