import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatTRY, formatPercent } from "@/lib/money";
import { updateOrderStatus } from "@/lib/orders/actions";
import { createInvoiceDraft } from "@/lib/invoices/actions";
import { createDeliveryNote } from "@/lib/deliveryNotes/actions";
import { PRODUCTION_STAGE_LABEL } from "@/lib/orders/productionStages";
import { PAYMENT_METHOD_LABEL } from "@/lib/orders/paymentMethods";
import OrderTimeline from "@/components/OrderTimeline";
import ProductionStageControls from "./ProductionStageControls";
import ShipmentForm from "./ShipmentForm";

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const order = await prisma.order.findUnique({
    where: { id: params.id },
    include: {
      items: true,
      user: { include: { customerProfile: true } },
      invoice: true,
      shipment: true,
      deliveryNote: true,
      productionEvents: { orderBy: { createdAt: "asc" } },
      stockMovements: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!order) notFound();

  const isClosed = order.status === "SHIPPED" || order.status === "CANCELLED";
  const isCancelled = order.status === "CANCELLED";
  const canApprove = order.status === "PENDING";
  const canCancel = order.status === "PENDING" || order.status === "APPROVED" || order.status === "PREPARING";
  const canAdvance = !isClosed && order.status !== "PENDING" && !isCancelled;

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
              {order.items.map((it) => {
                const cfg = (it.configuration as any) ?? null;
                const alloc = (it.warehouseAllocation as any[]) ?? [];
                return (
                  <tr key={it.id} className="border-t border-slate-100 align-top">
                    <td className="py-2 font-mono text-xs">{it.sku}</td>
                    <td>
                      <div>{it.productName}</div>
                      {cfg?.summary ? <div className="text-xs text-slate-500">{cfg.summary}</div> : null}
                      {alloc.length > 0 ? (
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Depodan: {alloc.map((a) => `${a.quantity} adet`).join(", ")}
                        </div>
                      ) : null}
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

        <aside className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-sm">
            <h3 className="font-semibold mb-2">Ödeme</h3>
            <p>{PAYMENT_METHOD_LABEL[order.paymentMethod]}</p>
            <p className="text-xs text-slate-500 mt-1">MVP&apos;de gerçek tahsilat yapılmaz; ödeme manuel takip edilir.</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5">
            <h3 className="font-semibold mb-2">Müşteri</h3>
            <p className="text-sm">{order.user.name ?? "—"}</p>
            <p className="text-sm text-slate-500">{order.user.email}</p>
            {order.user.customerProfile ? (
              <div className="text-sm text-slate-600 mt-2">
                <p>{order.user.customerProfile.companyName}</p>
                {order.user.customerProfile.taxNumber && <p>VKN: {order.user.customerProfile.taxNumber}</p>}
                {order.user.customerProfile.phone && <p>{order.user.customerProfile.phone}</p>}
                {order.user.customerProfile.address && <p className="text-xs text-slate-500 mt-1">{order.user.customerProfile.address}</p>}
              </div>
            ) : null}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold">Sipariş Durumu</h3>
            <div className="text-sm">
              Mevcut: <span className="inline-block text-xs bg-slate-900 text-white px-2 py-0.5 rounded">{order.status}</span>
              <span className="text-xs text-slate-500 ml-2">{PRODUCTION_STAGE_LABEL[order.productionStage]}</span>
            </div>
            <div className="flex flex-col gap-2">
              {canApprove ? (
                <form action={async () => { "use server"; await updateOrderStatus(order.id, "APPROVED"); }}>
                  <button className="w-full text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2">
                    Siparişi onayla → APPROVED
                  </button>
                </form>
              ) : null}
              {canCancel ? (
                <form action={async () => { "use server"; await updateOrderStatus(order.id, "CANCELLED"); }}>
                  <button className="w-full text-sm border border-red-300 text-red-700 hover:bg-red-50 rounded-lg px-3 py-2">
                    Siparişi iptal et
                  </button>
                </form>
              ) : null}
              {isClosed && order.status === "SHIPPED" ? (
                <p className="text-xs text-slate-500">Sipariş yola çıktı; üretim panelinden DELIVERED&apos;a alınabilir.</p>
              ) : null}
              {isCancelled ? (
                <p className="text-xs text-red-700">İptal edildi.</p>
              ) : null}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
            <h3 className="font-semibold">Belgeler</h3>
            {order.invoice ? (
              <Link
                href={`/invoices/${order.invoice.id}`}
                className="block text-center bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                Fatura taslağı: {order.invoice.invoiceNumber}
              </Link>
            ) : (
              <form action={async () => { "use server"; await createInvoiceDraft(order.id); }}>
                <button className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-3 py-2 text-sm">
                  Taslak fatura oluştur
                </button>
              </form>
            )}
            {order.deliveryNote ? (
              <Link
                href={`/delivery-notes/${order.deliveryNote.id}`}
                className="block text-center bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-2 text-sm"
              >
                İrsaliye: {order.deliveryNote.noteNumber}
              </Link>
            ) : (
              <form action={async () => { "use server"; await createDeliveryNote(order.id); }}>
                <button className="w-full border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg px-3 py-2 text-sm">
                  Sevk irsaliyesi taslağı oluştur
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold mb-3">Üretim & Sevk Süreci</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <OrderTimeline
            current={order.productionStage}
            events={order.productionEvents.map((e) => ({ stage: e.stage, createdAt: e.createdAt, note: e.note }))}
            cancelled={isCancelled}
          />
          {canAdvance ? (
            <ProductionStageControls
              orderId={order.id}
              current={order.productionStage}
              hasShipment={!!order.shipment}
            />
          ) : (
            <p className="text-sm text-slate-500">{isCancelled ? "Sipariş iptal edildiği için üretim süreci kapatıldı." : "Önce siparişi onaylayın."}</p>
          )}
        </div>
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold mb-3">Sevkiyat (TIR / Şoför)</h3>
        <ShipmentForm
          orderId={order.id}
          defaults={{
            truckPlate: order.shipment?.truckPlate ?? "",
            driverName: order.shipment?.driverName ?? "",
            driverPhone: order.shipment?.driverPhone ?? "",
            etaAt: order.shipment?.etaAt ? toDateInput(order.shipment.etaAt) : "",
          }}
          trackingToken={order.shipment?.trackingToken}
        />
      </section>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h3 className="font-semibold mb-3">Stok Hareketleri</h3>
        {order.stockMovements.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz hareket yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500"><tr>
              <th>Tarih</th><th>Tip</th><th className="text-right">Miktar</th><th>Not</th>
            </tr></thead>
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

function toDateInput(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  return tz.toISOString().slice(0, 16);
}
