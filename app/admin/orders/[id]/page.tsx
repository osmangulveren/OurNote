import Link from "next/link";
import { notFound } from "next/navigation";
import OrderItemsTable from "@/components/OrderItemsTable";
import { OrderStepper } from "@/components/OrderTracker";
import StatusBadge from "@/components/StatusBadge";
import TotalsBox from "@/components/TotalsBox";
import { adminMarkPaid, assignOrderToShipment, updateOrderStatus } from "@/app/actions/admin";
import { countryName } from "@/lib/config";
import { db } from "@/lib/db";
import { dateTime, money } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/lib/status";

export const metadata = { title: "Order" };

export default async function AdminOrder({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await db.order.findUnique({
    where: { id },
    include: { company: true, user: true, items: { include: { product: true } }, events: { orderBy: { createdAt: "asc" } }, shipment: true },
  });
  if (!order) notFound();
  const trucks = await db.shipment.findMany({ where: { stage: { in: ["PLANNED", "LOADING"] } }, orderBy: { createdAt: "desc" } });
  const cost = order.items.reduce((s, i) => s + i.product.supplierPrice * i.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="muted">← Orders</Link>
          <h1 className="h1 mt-1 flex items-center gap-3">{order.number} <StatusBadge status={order.status} /></h1>
          <p className="muted">{order.company.name} · {order.user.name} ({order.user.email}) · {dateTime(order.createdAt)}</p>
        </div>
        <Link href={`/orders/${order.id}/invoice`} target="_blank" className="btn-outline">Invoice</Link>
      </div>

      <section className="card p-6"><OrderStepper status={order.status} events={order.events} /></section>

      <div className="grid gap-4 lg:grid-cols-3">
        <form action={updateOrderStatus} className="card space-y-3 p-5">
          <h2 className="font-bold">Change status</h2>
          <input type="hidden" name="id" value={order.id} />
          <select name="status" defaultValue={order.status} className="input">
            {ORDER_STATUSES.map((s) => <option key={s} value={s}>{ORDER_STATUS_LABEL[s]}</option>)}
          </select>
          <input name="note" placeholder="Note (visible in history)" className="input" />
          <button className="btn-primary w-full">Update</button>
        </form>
        <div className="card space-y-3 p-5">
          <h2 className="font-bold">Payment</h2>
          <p className="text-sm">{order.paymentMethod === "STRIPE" ? "Card (Stripe)" : "Bank transfer"} · <b>{order.paymentStatus}</b></p>
          {order.paymentStatus !== "PAID" && (
            <form action={adminMarkPaid}><input type="hidden" name="id" value={order.id} /><button className="btn-primary w-full">Mark as paid</button></form>
          )}
          {cost > 0 && <p className="text-xs text-slate-500">Purchase cost {money(cost)} · gross margin {money(order.subtotal - cost)}</p>}
        </div>
        <div className="card space-y-3 p-5">
          <h2 className="font-bold">Truck</h2>
          {order.shipment ? (
            <p className="text-sm">On <Link href={`/admin/shipments/${order.shipment.id}`} className="font-semibold text-brand-600">{order.shipment.code}</Link> ({order.shipment.truckPlate})</p>
          ) : trucks.length > 0 ? (
            <form action={assignOrderToShipment} className="space-y-2">
              <input type="hidden" name="orderId" value={order.id} />
              <select name="shipmentId" className="input">{trucks.map((t) => <option key={t.id} value={t.id}>{t.code} · {t.truckPlate}</option>)}</select>
              <button className="btn-primary w-full">Put on truck</button>
            </form>
          ) : (
            <Link href="/admin/shipments/new" className="btn-outline w-full">Plan a truck</Link>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <section className="card overflow-x-auto"><OrderItemsTable items={order.items} /></section>
        <div className="space-y-4">
          <TotalsBox totals={{ ...order, volume: order.totalVolumeM3 }} />
          <div className="card p-5 text-sm">
            <div className="label">Deliver to</div>
            <b>{order.deliveryName}</b><br />{order.deliveryAddress}<br />{order.deliveryPostal} {order.deliveryCity}, {countryName(order.deliveryCountry)}<br />{order.deliveryPhone}
            {order.notes && <p className="mt-2 rounded bg-slate-50 p-2 text-xs">{order.notes}</p>}
            <div className="label mt-4">Billing VAT</div>{order.company.vatNumber ?? "—"} ({countryName(order.company.country)})
          </div>
        </div>
      </div>
    </div>
  );
}
