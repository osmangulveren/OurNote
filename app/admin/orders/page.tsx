import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { countryName } from "@/lib/config";
import { db } from "@/lib/db";
import { cbm, date, money } from "@/lib/format";
import { ORDER_STATUS_LABEL, ORDER_STATUSES } from "@/lib/status";

export const metadata = { title: "Orders" };

export default async function AdminOrders({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const orders = await db.order.findMany({
    where: status ? { status } : {},
    include: { company: true, shipment: true },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div className="space-y-6">
      <h1 className="h1">Orders</h1>
      <div className="flex flex-wrap gap-2 text-sm">
        <Link href="/admin/orders" className={`rounded-full px-3 py-1 ${!status ? "bg-brand-600 text-white" : "bg-white ring-1 ring-slate-200"}`}>All</Link>
        {ORDER_STATUSES.map((s) => (
          <Link key={s} href={`/admin/orders?status=${s}`} className={`rounded-full px-3 py-1 ${status === s ? "bg-brand-600 text-white" : "bg-white ring-1 ring-slate-200"}`}>{ORDER_STATUS_LABEL[s]}</Link>
        ))}
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Destination</th><th>Date</th><th className="text-right">Total</th><th>Volume</th><th>Payment</th><th>Truck</th><th>Status</th></tr></thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-brand-600">{o.number}</Link></td>
                <td>{o.company.name}</td>
                <td>{o.deliveryCity}, {countryName(o.deliveryCountry)}</td>
                <td>{date(o.createdAt)}</td>
                <td className="text-right font-semibold">{money(o.total)}</td>
                <td>{cbm(o.totalVolumeM3)}</td>
                <td>{o.paymentStatus === "PAID" ? <span className="badge bg-emerald-100 text-emerald-800">Paid</span> : <span className="badge bg-amber-100 text-amber-800">{o.paymentMethod === "STRIPE" ? "Card – unpaid" : "Transfer – unpaid"}</span>}</td>
                <td>{o.shipment ? <Link href={`/admin/shipments/${o.shipment.id}`} className="text-brand-600">{o.shipment.code}</Link> : "—"}</td>
                <td><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
        {orders.length === 0 && <p className="p-6 text-center text-slate-500">No orders.</p>}
      </div>
    </div>
  );
}
