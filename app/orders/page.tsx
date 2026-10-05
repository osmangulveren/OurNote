import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { requireBuyer } from "@/lib/auth";
import { db } from "@/lib/db";
import { date, money } from "@/lib/format";

export const metadata = { title: "My orders" };

export default async function OrdersPage() {
  const user = await requireBuyer();
  const orders = await db.order.findMany({
    where: { companyId: user.company.id },
    include: { shipment: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  const inTransit = orders.filter((o) => ["LOADING", "IN_TRANSIT", "CUSTOMS", "OUT_FOR_DELIVERY"].includes(o.status));

  return (
    <div className="container-page py-8">
      <h1 className="h1 mb-6">My orders</h1>
      {inTransit.length > 0 && (
        <div className="mb-6 grid gap-3 md:grid-cols-2">
          {inTransit.map((o) => (
            <Link key={o.id} href={`/orders/${o.id}`} className="card flex items-center gap-4 border-brand-200 bg-brand-50 p-4 hover:border-brand-500">
              <span className="text-3xl">🚚</span>
              <div className="flex-1">
                <div className="font-semibold">{o.number} is on its way</div>
                <div className="muted">{o.shipment ? `Truck ${o.shipment.truckPlate} · ETA ${date(o.shipment.eta)}` : "Being prepared for shipping"}</div>
              </div>
              <StatusBadge status={o.status} />
            </Link>
          ))}
        </div>
      )}
      {orders.length === 0 ? (
        <div className="card p-10 text-center">
          <p className="muted mb-4">You haven&apos;t placed any orders yet.</p>
          <Link href="/catalog" className="btn-primary">Browse catalog</Link>
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Order</th><th>Date</th><th>Items</th><th>Total</th><th>Payment</th><th>Status</th><th /></tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td className="font-mono font-semibold">{o.number}</td>
                  <td>{date(o.createdAt)}</td>
                  <td>{o._count.items}</td>
                  <td className="font-semibold">{money(o.total)}</td>
                  <td>{o.paymentStatus === "PAID" ? <span className="badge bg-emerald-100 text-emerald-800">Paid</span> : <span className="badge bg-amber-100 text-amber-800">Unpaid</span>}</td>
                  <td><StatusBadge status={o.status} /></td>
                  <td className="text-right"><Link href={`/orders/${o.id}`} className="font-semibold text-brand-600">Track →</Link></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
