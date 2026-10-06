import Link from "next/link";
import { Reveal, RevealGroup, RevealItem, SplitHeading } from "@/components/motion/Reveal";
import RouteMap from "@/components/RouteMap";
import StatusBadge from "@/components/StatusBadge";
import { requireBuyer } from "@/lib/auth";
import { countryName } from "@/lib/config";
import { db } from "@/lib/db";
import { date, money } from "@/lib/format";
import { mapStage, PAYMENT_LABEL } from "@/lib/status";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const user = await requireBuyer();
  const orders = await db.order.findMany({
    where: { companyId: user.company.id },
    include: { shipment: true, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });
  const moving = orders.filter((o) => ["LOADING", "IN_TRANSIT", "CUSTOMS", "OUT_FOR_DELIVERY"].includes(o.status));

  return (
    <div className="container-page pt-24 md:pt-28">
      <Reveal className="eyebrow mb-3">{orders.length} orders · {moving.length} on the road</Reveal>
      <SplitHeading text="Your *orders.*" className="display mb-10 text-[clamp(3rem,7vw,6rem)]" />

      {moving.map((o) => (
        <Reveal key={o.id} className="mb-8">
          <Link href={`/orders/${o.id}`} className="group grid overflow-hidden rounded-[28px] bg-paper ring-1 ring-line transition hover:ring-ink/25 lg:grid-cols-[1fr_1.4fr]">
            <div className="flex flex-col justify-between gap-8 p-8">
              <div>
                <StatusBadge status={o.status} />
                <div className="mt-4 font-display text-5xl leading-none">{o.number}</div>
                <div className="mt-2 text-ink-3">
                  {o.shipment ? <>Truck <span className="num">{o.shipment.truckPlate}</span> · arriving around <b className="font-medium text-ink">{date(o.shipment.eta)}</b></> : "Being prepared for the truck"}
                </div>
              </div>
              <span className="font-mono text-[11px] uppercase tracking-wider">Follow the truck →</span>
            </div>
            <RouteMap country={o.deliveryCountry} stage={mapStage(o.status, o.shipment?.stage)} label={o.deliveryCity} className="h-72 lg:h-auto lg:min-h-[320px]" />
          </Link>
        </Reveal>
      ))}

      {orders.length === 0 ? (
        <div className="py-20 text-center">
          <p className="muted mb-6">No orders yet.</p>
          <Link href="/catalog" className="btn-primary">Browse the collection</Link>
        </div>
      ) : (
        <RevealGroup className="border-t border-line">
          {orders.map((o) => (
            <RevealItem key={o.id}>
              <Link href={`/orders/${o.id}`} className="group grid grid-cols-2 items-center gap-3 border-b border-line py-5 transition-colors hover:bg-paper sm:grid-cols-[1.2fr_1fr_1fr_1fr_1fr_auto] sm:px-3">
                <span className="font-display text-2xl leading-none">{o.number}</span>
                <span className="text-sm text-ink-3">{date(o.createdAt)}</span>
                <span className="text-sm text-ink-3">{o.deliveryCity}, {countryName(o.deliveryCountry)}</span>
                <span className="num">{money(o.total)}</span>
                <span className="text-sm">{PAYMENT_LABEL[o.paymentStatus]}</span>
                <span className="flex items-center justify-end gap-3"><StatusBadge status={o.status} /><span className="transition-transform group-hover:translate-x-1">→</span></span>
              </Link>
            </RevealItem>
          ))}
        </RevealGroup>
      )}
    </div>
  );
}
