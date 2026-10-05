import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";
import { db } from "@/lib/db";
import { date, money } from "@/lib/format";

export const metadata = { title: "Admin" };

export default async function AdminDashboard() {
  const [paidAgg, unpaidAgg, openOrders, toShip, activeTrucks, pendingCompanies, products, recent] = await Promise.all([
    db.order.aggregate({ _sum: { total: true }, where: { paymentStatus: "PAID" } }),
    db.order.aggregate({ _sum: { total: true }, _count: true, where: { paymentStatus: "UNPAID", status: { not: "CANCELLED" } } }),
    db.order.count({ where: { status: { notIn: ["DELIVERED", "CANCELLED"] } } }),
    db.order.count({ where: { shipmentId: null, status: { in: ["CONFIRMED", "IN_PRODUCTION"] } } }),
    db.shipment.count({ where: { stage: { notIn: ["COMPLETED"] } } }),
    db.company.count({ where: { status: "PENDING" } }),
    db.product.count({ where: { active: true } }),
    db.order.findMany({ include: { company: true }, orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const stats = [
    ["Paid revenue", money(paidAgg._sum.total ?? 0), "/admin/orders"],
    ["Awaiting payment", `${money(unpaidAgg._sum.total ?? 0)} (${unpaidAgg._count})`, "/admin/orders?status=PENDING_PAYMENT"],
    ["Open orders", String(openOrders), "/admin/orders"],
    ["Paid, not on a truck", String(toShip), "/admin/shipments"],
    ["Active trucks", String(activeTrucks), "/admin/shipments"],
    ["Pending applications", String(pendingCompanies), "/admin/customers"],
    ["Active products", String(products), "/admin/products"],
  ];

  return (
    <div className="space-y-8">
      <h1 className="h1">Dashboard</h1>
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {stats.map(([k, v, href]) => (
          <Link key={k} href={href} className="card p-5 hover:border-brand-500">
            <div className="label">{k}</div>
            <div className="text-xl font-bold">{v}</div>
          </Link>
        ))}
      </div>
      <section className="card overflow-x-auto">
        <div className="flex items-center justify-between p-4"><h2 className="font-bold">Latest orders</h2><Link href="/admin/orders" className="text-sm font-semibold text-brand-600">All orders →</Link></div>
        <table className="table">
          <thead><tr><th>Order</th><th>Customer</th><th>Date</th><th>Total</th><th>Status</th></tr></thead>
          <tbody>
            {recent.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold text-brand-600">{o.number}</Link></td>
                <td>{o.company.name}</td><td>{date(o.createdAt)}</td><td>{money(o.total)}</td><td><StatusBadge status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
