import Link from "next/link";
import { notFound } from "next/navigation";
import { TruckRoute } from "@/components/OrderTracker";
import ShipmentFields from "@/components/ShipmentFields";
import StatusBadge from "@/components/StatusBadge";
import {
  addShipmentEvent, assignOrderToShipment, markOrderDelivered, removeOrderFromShipment, updateShipment,
} from "@/app/actions/admin";
import { config, countryName } from "@/lib/config";
import { db } from "@/lib/db";
import { cbm, dateTime, money } from "@/lib/format";
import { SHIPMENT_STAGES, SHIPMENT_STAGE_LABEL } from "@/lib/status";

export const metadata = { title: "Truck" };

export default async function ShipmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = await db.shipment.findUnique({
    where: { id },
    include: { orders: { include: { company: true } }, events: { orderBy: { createdAt: "desc" } } },
  });
  if (!s) notFound();
  const candidates = await db.order.findMany({
    where: { shipmentId: null, status: { in: ["CONFIRMED", "IN_PRODUCTION", "LOADING"] } },
    include: { company: true },
  });
  const vol = s.orders.reduce((a, o) => a + o.totalVolumeM3, 0);
  const fill = (vol / config.truckCapacityCbm) * 100;
  const nextStage = SHIPMENT_STAGES[Math.min(SHIPMENT_STAGES.findIndex((x) => x.key === s.stage) + 1, SHIPMENT_STAGES.length - 1)];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/shipments" className="muted">← Trucks</Link>
        <h1 className="h1 mt-1 flex items-center gap-3">{s.code} · {s.truckPlate} <StatusBadge status={s.stage} kind="shipment" /></h1>
        <p className="muted">{s.route}</p>
      </div>

      <section className="card p-6">
        <TruckRoute stage={s.stage} />
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Load</span><span>{cbm(vol)} of {config.truckCapacityCbm} m³ ({fill.toFixed(0)}%)</span></div>
          <div className="h-2 rounded-full bg-slate-100"><div className={`h-2 rounded-full ${fill > 100 ? "bg-red-500" : "bg-accent-500"}`} style={{ width: `${Math.min(100, fill)}%` }} /></div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <form key={s.stage + s.events.length} action={addShipmentEvent} className="card space-y-3 p-6">
          <h2 className="font-bold">Post a tracking update</h2>
          <p className="muted">All stores on this truck see the update, and their orders move to the matching status.</p>
          <input type="hidden" name="id" value={s.id} />
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="label">Stage</label>
              <select name="stage" defaultValue={nextStage.key} className="input">
                {SHIPMENT_STAGES.map((x) => <option key={x.key} value={x.key}>{x.label}</option>)}
              </select>
            </div>
            <div><label className="label">Location</label><input name="location" required className="input" placeholder="e.g. Kapıkule border" /></div>
            <div><label className="label">New ETA (optional)</label><input name="eta" type="date" className="input" /></div>
            <div><label className="label">Note</label><input name="note" className="input" /></div>
          </div>
          <button className="btn-accent w-full">Post update</button>
        </form>

        <section className="card p-6">
          <h2 className="mb-3 font-bold">Tracking history</h2>
          {s.events.length === 0 ? <p className="muted">No updates yet.</p> : (
            <ol className="space-y-2 text-sm">
              {s.events.map((e) => (
                <li key={e.id}><b>{SHIPMENT_STAGE_LABEL[e.stage]}</b> · {e.location}<div className="text-xs text-slate-500">{dateTime(e.createdAt)}{e.note && ` — ${e.note}`}</div></li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="card overflow-x-auto">
        <h2 className="p-4 font-bold">Orders on this truck ({s.orders.length})</h2>
        <table className="table">
          <thead><tr><th>Order</th><th>Store</th><th>Deliver to</th><th>Volume</th><th>Total</th><th>Status</th><th /></tr></thead>
          <tbody>
            {s.orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-brand-600">{o.number}</Link></td>
                <td>{o.company.name}</td>
                <td className="text-xs">{o.deliveryAddress}, {o.deliveryPostal} {o.deliveryCity}, {countryName(o.deliveryCountry)} · {o.deliveryPhone}</td>
                <td>{cbm(o.totalVolumeM3)}</td>
                <td>{money(o.total)}</td>
                <td><StatusBadge status={o.status} /></td>
                <td className="whitespace-nowrap text-right">
                  {o.status !== "DELIVERED" && (
                    <form action={markOrderDelivered} className="inline"><input type="hidden" name="orderId" value={o.id} /><button className="btn-primary px-3 py-1 text-xs">Delivered</button></form>
                  )}
                  {["CONFIRMED", "IN_PRODUCTION", "LOADING"].includes(o.status) && (
                    <form action={removeOrderFromShipment} className="ml-1 inline"><input type="hidden" name="orderId" value={o.id} /><button className="text-xs text-slate-500 hover:text-red-600">Remove</button></form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {candidates.length > 0 && (
          <form action={assignOrderToShipment} className="flex flex-wrap items-end gap-3 border-t border-slate-100 p-4">
            <input type="hidden" name="shipmentId" value={s.id} />
            <div className="min-w-64 flex-1">
              <label className="label">Add a paid order</label>
              <select name="orderId" className="input">
                {candidates.map((o) => <option key={o.id} value={o.id}>{o.number} · {o.company.name} · {o.deliveryCity} · {cbm(o.totalVolumeM3)}</option>)}
              </select>
            </div>
            <button className="btn-outline">Add to truck</button>
          </form>
        )}
      </section>

      <details className="card p-6">
        <summary className="cursor-pointer font-bold">Truck details</summary>
        <form action={updateShipment} className="mt-4 grid gap-4 sm:grid-cols-3">
          <input type="hidden" name="id" value={s.id} />
          <ShipmentFields s={s} />
          <button className="btn-primary sm:col-span-3">Save</button>
        </form>
      </details>
    </div>
  );
}
