import Link from "next/link";
import { notFound } from "next/navigation";
import OrderItemsTable from "@/components/OrderItemsTable";
import { OrderStepper, TruckRoute } from "@/components/OrderTracker";
import StatusBadge from "@/components/StatusBadge";
import TotalsBox from "@/components/TotalsBox";
import { payOrder, reorder } from "@/app/actions/orders";
import { requireBuyer } from "@/lib/auth";
import { config, countryName } from "@/lib/config";
import { db } from "@/lib/db";
import { date, dateTime, money } from "@/lib/format";
import { markOrderPaid } from "@/lib/orders";
import { SHIPMENT_STAGE_LABEL } from "@/lib/status";
import { stripe } from "@/lib/stripe";

export const metadata = { title: "Order" };

export default async function OrderPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; placed?: string }> }) {
  const user = await requireBuyer();
  const { id } = await params;
  const { paid, placed } = await searchParams;

  let order = await db.order.findFirst({ where: { id, companyId: user.company.id } });
  if (!order) notFound();

  // Returning from Stripe: confirm payment directly in case the webhook hasn't arrived yet.
  if (paid && order.paymentStatus !== "PAID" && order.stripeSessionId) {
    const session = await stripe()?.checkout.sessions.retrieve(order.stripeSessionId);
    if (session?.payment_status === "paid") await markOrderPaid(order.id, "Card payment received (Stripe)");
  }

  order = await db.order.findUniqueOrThrow({ where: { id } });
  const [items, events, shipment] = await Promise.all([
    db.orderItem.findMany({ where: { orderId: id } }),
    db.orderEvent.findMany({ where: { orderId: id }, orderBy: { createdAt: "asc" } }),
    order.shipmentId
      ? db.shipment.findUnique({ where: { id: order.shipmentId }, include: { events: { orderBy: { createdAt: "desc" } } } })
      : null,
  ]);
  const unpaid = order.paymentStatus !== "PAID" && order.status !== "CANCELLED";

  return (
    <div className="container-page space-y-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link href="/orders" className="muted hover:text-slate-700">← My orders</Link>
          <h1 className="h1 mt-1 flex items-center gap-3">Order {order.number} <StatusBadge status={order.status} /></h1>
          <p className="muted">Placed {dateTime(order.createdAt)}</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/orders/${order.id}/invoice`} className="btn-outline" target="_blank">{order.paymentStatus === "PAID" ? "Invoice" : "Proforma invoice"}</Link>
          <form action={reorder}><input type="hidden" name="orderId" value={order.id} /><button className="btn-outline">Order again</button></form>
        </div>
      </div>

      {placed && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">Thank you! Your order has been placed.</div>}

      {unpaid && (
        <div className="card border-amber-200 bg-amber-50 p-5">
          <div className="font-semibold text-amber-900">Payment pending – {money(order.total)}</div>
          {order.paymentMethod === "BANK_TRANSFER" || !config.stripeEnabled ? (
            <div className="mt-2 grid gap-1 text-sm text-amber-900 sm:grid-cols-2">
              <div>Beneficiary: <b>{config.company.legalName}</b></div>
              <div>Bank: <b>{config.company.bank || "—"}</b></div>
              <div>IBAN: <b className="font-mono">{config.company.iban || "—"}</b></div>
              <div>Reference: <b className="font-mono">{order.number}</b></div>
            </div>
          ) : null}
          {config.stripeEnabled && (
            <form action={payOrder} className="mt-3">
              <input type="hidden" name="orderId" value={order.id} />
              <button className="btn-accent">Pay online now</button>
            </form>
          )}
        </div>
      )}

      <section className="card p-6">
        <h2 className="mb-5 font-bold">Order progress</h2>
        <OrderStepper status={order.status} events={events} />
      </section>

      {shipment && (
        <section className="card p-6">
          <div className="mb-2 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-bold">Your truck · {shipment.code}</h2>
              <p className="muted">{shipment.route}</p>
            </div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-4">
              <div><div className="label">Plate</div>{shipment.truckPlate}{shipment.trailerPlate && ` / ${shipment.trailerPlate}`}</div>
              <div><div className="label">Departed</div>{date(shipment.departedAt)}</div>
              <div><div className="label">ETA</div><b>{order.deliveredAt ? `Delivered ${date(order.deliveredAt)}` : date(shipment.eta)}</b></div>
              <div><div className="label">Driver</div>{shipment.driverName || "—"}{shipment.driverPhone && <div className="text-xs">{shipment.driverPhone}</div>}</div>
            </div>
          </div>
          <TruckRoute stage={shipment.stage} delivered={order.status === "DELIVERED"} />
          {shipment.events.length > 0 && (
            <ol className="mt-6 space-y-0 border-l-2 border-slate-200 pl-5">
              {shipment.events.map((e, i) => (
                <li key={e.id} className="relative pb-4">
                  <span className={`absolute -left-[27px] top-1 h-3 w-3 rounded-full ${i === 0 ? "bg-accent-500 ring-4 ring-accent-500/20" : "bg-slate-300"}`} />
                  <div className="text-sm font-semibold">{SHIPMENT_STAGE_LABEL[e.stage] ?? e.stage} · {e.location}</div>
                  <div className="text-xs text-slate-500">{dateTime(e.createdAt)}{e.note && ` — ${e.note}`}</div>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <section className="card overflow-x-auto">
          <OrderItemsTable items={items} />
        </section>
        <div className="space-y-4">
          <TotalsBox totals={{ ...order, volume: order.totalVolumeM3 }} />
          <div className="card p-5 text-sm">
            <div className="label">Delivery to</div>
            <div className="font-semibold">{order.deliveryName}</div>
            <div>{order.deliveryAddress}</div>
            <div>{order.deliveryPostal} {order.deliveryCity}, {countryName(order.deliveryCountry)}</div>
            <div className="text-slate-500">{order.deliveryPhone}</div>
            {order.notes && <p className="mt-2 rounded bg-slate-50 p-2 text-xs">{order.notes}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
