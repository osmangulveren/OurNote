import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal, SplitHeading } from "@/components/motion/Reveal";
import OrderItemsTable from "@/components/OrderItemsTable";
import { OrderStepper } from "@/components/OrderTracker";
import RouteMap from "@/components/RouteMap";
import StatusBadge from "@/components/StatusBadge";
import TotalsBox from "@/components/TotalsBox";
import { createClaim, payOrder, reorder } from "@/app/actions/orders";
import { requireBuyer } from "@/lib/auth";
import { config, countryName } from "@/lib/config";
import { db } from "@/lib/db";
import { date, dateTime, money } from "@/lib/format";
import { amountDue, recordPayment } from "@/lib/orders";
import { mapStage, PAYMENT_LABEL, SHIPMENT_STAGE_LABEL } from "@/lib/status";
import { stripe } from "@/lib/stripe";

export const metadata = { title: "Order" };

export default async function OrderPage({
  params, searchParams,
}: { params: Promise<{ id: string }>; searchParams: Promise<{ paid?: string; placed?: string }> }) {
  const user = await requireBuyer();
  const { id } = await params;
  const { paid, placed } = await searchParams;

  const found = await db.order.findFirst({ where: { id, companyId: user.company.id } });
  if (!found) notFound();

  // Back from Stripe: confirm directly in case the webhook hasn't arrived yet.
  if (paid && found.paymentStatus !== "PAID" && found.stripeSessionId) {
    const session = await stripe()?.checkout.sessions.retrieve(found.stripeSessionId);
    if (session?.payment_status === "paid") await recordPayment(found.id, session.metadata?.kind === "DEPOSIT" ? "DEPOSIT" : "BALANCE", "card");
  }

  const order = await db.order.findUniqueOrThrow({
    where: { id },
    include: {
      items: true, claims: { orderBy: { createdAt: "desc" } }, events: { orderBy: { createdAt: "asc" } },
      shipment: { include: { events: { orderBy: { createdAt: "desc" } } } },
    },
  });
  const s = order.shipment;
  const due = order.paymentStatus === "PAID" || order.status === "CANCELLED" ? 0 : amountDue(order);
  const dueLabel = order.paymentStatus === "UNPAID" && order.paymentPlan === "DEPOSIT" ? `${config.depositPercent}% deposit to start production` : order.paymentStatus === "DEPOSIT_PAID" ? "Balance — due before loading" : "Payment due";
  const canClaim = ["OUT_FOR_DELIVERY", "DELIVERED"].includes(order.status);

  return (
    <div className="container-page pt-24 md:pt-28">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/orders" className="font-mono text-[11px] uppercase tracking-wider text-stone link-underline">← All orders</Link>
          <SplitHeading text={order.number} className="display mt-3 text-[clamp(3rem,7vw,6rem)]" />
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-3">
            <StatusBadge status={order.status} /> Placed {dateTime(order.createdAt)} · {PAYMENT_LABEL[order.paymentStatus]}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/orders/${order.id}/invoice`} target="_blank" className="btn-outline">{order.paymentStatus === "PAID" ? "Invoice" : "Proforma"} ↗</Link>
          <form action={reorder}><input type="hidden" name="orderId" value={order.id} /><button className="btn-ghost">Order again</button></form>
        </div>
      </div>

      {placed && (
        <Reveal className="mb-6 rounded-2xl bg-moss-2 p-5 text-moss">
          <b className="font-medium">Order placed.</b> {due > 0 ? "Production starts as soon as the payment below arrives." : "We'll keep this page updated at every step."}
        </Reveal>
      )}

      {due > 0 && (
        <Reveal className="mb-6 grid gap-6 rounded-[22px] bg-ink p-7 text-bone md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="eyebrow text-stone-2">{dueLabel}</div>
            <div className="num mt-1 font-display text-5xl">{money(due)}</div>
            {(order.paymentMethod === "BANK_TRANSFER" || !config.stripeEnabled) && (
              <div className="mt-4 grid gap-x-8 gap-y-1 text-sm text-stone-2 sm:grid-cols-2">
                <div>Beneficiary <span className="text-bone">{config.company.legalName}</span></div>
                <div>Bank <span className="text-bone">{config.company.bank || "—"}</span></div>
                <div>IBAN <span className="num text-bone">{config.company.iban || "—"}</span></div>
                <div>Reference <span className="num text-bone">{order.number}</span></div>
              </div>
            )}
          </div>
          {config.stripeEnabled && (
            <form action={payOrder}><input type="hidden" name="orderId" value={order.id} /><button className="btn bg-paper px-6 py-3 text-ink hover:bg-bone">Pay {money(due)} online</button></form>
          )}
        </Reveal>
      )}

      <Reveal className="overflow-hidden rounded-[28px] bg-paper ring-1 ring-line">
        <div className="grid lg:grid-cols-[1.5fr_1fr]">
          <RouteMap country={order.deliveryCountry} stage={mapStage(order.status, s?.stage)} label={order.deliveryCity} className="h-[340px] sm:h-[440px]" />
          <div className="border-t border-line p-7 lg:border-l lg:border-t-0">
            {s ? (
              <>
                <div className="eyebrow">Truck {s.code}</div>
                <div className="num mt-1 font-display text-4xl">{s.truckPlate}</div>
                <div className="mt-1 text-sm text-ink-3">{s.route}</div>
                <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
                  <div><dt className="label">Departs</dt><dd>{date(s.departedAt ?? s.plannedDepartureAt)}</dd></div>
                  <div><dt className="label">At your store</dt><dd className="font-medium">{order.deliveredAt ? `Delivered ${date(order.deliveredAt)}` : date(s.eta)}</dd></div>
                  <div><dt className="label">Driver</dt><dd>{s.driverName || "Assigned at loading"}</dd></div>
                  <div><dt className="label">Phone</dt><dd className="num">{s.driverPhone || "—"}</dd></div>
                </dl>
                {s.events.length > 0 && (
                  <ol className="mt-6 space-y-4 border-l border-line pl-5">
                    {s.events.map((e, i) => (
                      <li key={e.id} className="relative">
                        <span className={`absolute -left-[25px] top-1.5 h-2 w-2 rounded-full ${i === 0 ? "bg-clay ring-4 ring-clay/20" : "bg-stone-2"}`} />
                        <div className="text-sm font-medium">{SHIPMENT_STAGE_LABEL[e.stage]} · {e.location}</div>
                        <div className="text-xs text-stone">{dateTime(e.createdAt)}{e.note && ` — ${e.note}`}</div>
                      </li>
                    ))}
                  </ol>
                )}
              </>
            ) : (
              <>
                <div className="eyebrow">Truck</div>
                <div className="mt-1 font-display text-3xl leading-tight">Assigned when production is finished.</div>
                <p className="mt-3 text-sm text-ink-3">You&apos;ll see the plate, driver and live position here as soon as your pieces are loaded.</p>
              </>
            )}
          </div>
        </div>
        <div className="border-t border-line p-7"><OrderStepper status={order.status} events={order.events} /></div>
      </Reveal>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="space-y-8">
          <section className="panel overflow-x-auto"><OrderItemsTable items={order.items} /></section>

          {(canClaim || order.claims.length > 0) && (
            <section className="panel p-6">
              <h2 className="font-display text-3xl">Something wrong with the delivery?</h2>
              <p className="mt-1 text-sm text-ink-3">Report each affected piece. Note it on the driver&apos;s CMR too if the damage is visible at unloading.</p>
              {order.claims.map((c) => (
                <div key={c.id} className="mt-4 rounded-xl bg-bone p-4 text-sm">
                  <div className="flex justify-between"><b className="font-medium">{c.kind.replace("_", " ").toLowerCase()} · {c.sku} × {c.quantity}</b><span className={c.status === "OPEN" ? "text-clay" : "text-moss"}>{c.status === "OPEN" ? "Open" : "Resolved"}</span></div>
                  <p className="mt-1 text-ink-3">{c.description}</p>
                  {c.resolution && <p className="mt-2 text-moss">→ {c.resolution}</p>}
                </div>
              ))}
              {canClaim && (
                <form action={createClaim} className="mt-5 grid gap-3 sm:grid-cols-[1.2fr_0.5fr_1fr]">
                  <input type="hidden" name="orderId" value={order.id} />
                  <select name="sku" className="input">{order.items.map((i) => <option key={i.id} value={i.sku}>{i.sku} · {i.name}</option>)}</select>
                  <input name="quantity" type="number" min={1} defaultValue={1} className="input num" />
                  <select name="kind" className="input"><option value="DAMAGED">Damaged</option><option value="MISSING">Missing</option><option value="WRONG_ITEM">Wrong item / colour</option></select>
                  <textarea name="description" required minLength={5} rows={2} placeholder="What happened? Which carton / piece?" className="input sm:col-span-3" />
                  <button className="btn-primary sm:col-span-3 sm:justify-self-start">Report</button>
                </form>
              )}
            </section>
          )}
        </div>
        <div className="space-y-4">
          <TotalsBox totals={{ ...order, volume: order.totalVolumeM3 }} />
          <div className="panel p-6 text-sm">
            <div className="label">Delivery address</div>
            <div className="font-medium">{order.deliveryName}</div>
            <div className="text-ink-3">{order.deliveryAddress}<br />{order.deliveryPostal} {order.deliveryCity}, {countryName(order.deliveryCountry)}<br />{order.deliveryPhone}</div>
            {order.notes && <p className="mt-3 rounded-xl bg-bone p-3 text-xs">{order.notes}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
