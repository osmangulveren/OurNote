import Link from "next/link";
import { resolveClaim } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { date } from "@/lib/format";

export const metadata = { title: "Claims" };

export default async function ClaimsPage() {
  const claims = await db.claim.findMany({ include: { order: { include: { company: true } } }, orderBy: [{ status: "asc" }, { createdAt: "desc" }] });
  return (
    <div className="space-y-6">
      <h1 className="h1">Claims</h1>
      {claims.length === 0 && <p className="muted">No claims. Good packing pays off.</p>}
      {claims.map((c) => (
        <div key={c.id} className="card p-5">
          <div className="flex flex-wrap justify-between gap-2">
            <div className="font-medium">{c.kind.replace("_", " ")} · {c.sku} × {c.quantity}</div>
            <Link href={`/admin/orders/${c.orderId}`} className="text-sm text-clay">{c.order.number} · {c.order.company.name} · {date(c.createdAt)}</Link>
          </div>
          <p className="mt-2 text-sm text-ink-3">{c.description}</p>
          {c.status === "OPEN" ? (
            <form action={resolveClaim} className="mt-3 flex gap-2">
              <input type="hidden" name="id" value={c.id} />
              <input name="resolution" required placeholder="Resolution shown to the store" className="input" />
              <button className="btn-primary">Resolve</button>
            </form>
          ) : <p className="mt-2 text-sm text-moss">Resolved: {c.resolution}</p>}
        </div>
      ))}
    </div>
  );
}
