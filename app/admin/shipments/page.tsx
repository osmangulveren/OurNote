import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { cbm, date } from "@/lib/format";

export const metadata = { title: "Trucks" };

export default async function ShipmentsPage() {
  const [shipments, waiting] = await Promise.all([
    db.shipment.findMany({ include: { orders: { select: { totalVolumeM3: true } } }, orderBy: { createdAt: "desc" } }),
    db.order.findMany({ where: { shipmentId: null, status: { in: ["CONFIRMED", "IN_PRODUCTION"] } }, include: { company: true } }),
  ]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">Trucks (TIR)</h1>
        <Link href="/admin/shipments/new" className="btn-primary">Plan a truck</Link>
      </div>
      {waiting.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <b>{waiting.length} paid order(s) waiting for a truck</b> · {cbm(waiting.reduce((s, o) => s + o.totalVolumeM3, 0))} total:{" "}
          {waiting.map((o) => <Link key={o.id} href={`/admin/orders/${o.id}`} className="mr-2 underline">{o.number} ({o.company.name})</Link>)}
        </div>
      )}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Truck</th><th>Plate</th><th>Route</th><th>Orders</th><th>Load</th><th>ETA</th><th>Stage</th></tr></thead>
          <tbody>
            {shipments.map((s) => {
              const vol = s.orders.reduce((a, o) => a + o.totalVolumeM3, 0);
              return (
                <tr key={s.id}>
                  <td><Link href={`/admin/shipments/${s.id}`} className="font-mono font-semibold text-brand-600">{s.code}</Link></td>
                  <td>{s.truckPlate}</td>
                  <td className="max-w-xs truncate text-xs">{s.route}</td>
                  <td>{s.orders.length}</td>
                  <td>{cbm(vol)} · {((vol / config.truckCapacityCbm) * 100).toFixed(0)}%</td>
                  <td>{date(s.eta)}</td>
                  <td><StatusBadge status={s.stage} kind="shipment" /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {shipments.length === 0 && <p className="p-6 text-center text-slate-500">No trucks yet.</p>}
      </div>
    </div>
  );
}
