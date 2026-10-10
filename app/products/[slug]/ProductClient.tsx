"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { addToCart } from "@/app/actions/cart";
import Configurator from "@/components/Configurator";
import type { Shape } from "@/lib/shape";

type Tier = { minQty: number; price: number };
type Props = {
  product: { id: string; slug: string; modelUrl: string; name: string; sku: string; unit: string; moq: number; volumeM3: number; leadTimeDays: number; rrp: number };
  shape: Shape;
  colors: string[];
  tiers: Tier[] | null; // null = prices hidden
  canOrder: boolean;
  isGuest: boolean;
  truckCapacity: number;
  departures: { code: string; departAt: string | null; eta: string | null }[];
  transitDays: number;
};

const eur = (n: number, d = 2) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: d, maximumFractionDigits: d }).format(n);
const day = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export default function ProductClient({ product, shape, colors, tiers, canOrder, isGuest, truckCapacity, departures, transitDays }: Props) {
  const [color, setColor] = useState(colors[0] ?? "");
  const [qty, setQty] = useState(product.moq);
  const [rrp, setRrp] = useState(product.rrp || 0);
  const [vat, setVat] = useState(20);

  const unit = useMemo(() => {
    if (!tiers) return 0;
    let p = tiers[0].price;
    for (const t of tiers) if (qty >= t.minQty) p = t.price;
    return p;
  }, [qty, tiers]);
  const tierIdx = tiers ? tiers.findLastIndex((t) => qty >= t.minQty) : -1;
  const nextTier = tiers && tierIdx < tiers.length - 1 ? tiers[tierIdx + 1] : null;
  const volume = product.volumeM3 * qty;
  const netRetail = rrp / (1 + vat / 100);
  const markup = unit ? netRetail / unit : 0;
  const margin = netRetail ? ((netRetail - unit) / netRetail) * 100 : 0;

  // Delivery estimate: production lead time → first truck after that → road time
  const ready = new Date(Date.now() + product.leadTimeDays * 864e5);
  const truck = departures.find((d) => d.departAt && new Date(d.departAt) >= ready);
  const departs = truck?.departAt ? new Date(truck.departAt) : ready;
  const arrives = truck?.eta ? new Date(truck.eta) : new Date(departs.getTime() + transitDays * 864e5);

  return (
    <div className="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
      <div className="lg:sticky lg:top-24 lg:self-start">
        <div className="overflow-hidden rounded-[28px] bg-paper ring-1 ring-line">
          <div className="bg-grid">
            <Configurator shape={shape} colors={colors} onColorChange={setColor} stageClassName="h-[420px] sm:h-[560px]" modelUrl={product.modelUrl || undefined} name={product.name} />
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {tiers ? (
          <>
            <section className="panel p-6">
              <div className="flex items-baseline justify-between">
                <span className="eyebrow">Trade price · excl. VAT · delivered</span>
                <span className="font-mono text-[11px] text-stone">per {product.unit}</span>
              </div>
              <div className="mt-2 flex items-baseline gap-3">
                <AnimatePresence mode="popLayout">
                  <motion.span key={unit} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }} className="num font-display text-6xl leading-none">
                    {eur(unit, 0)}
                  </motion.span>
                </AnimatePresence>
                {nextTier && (
                  <span className="text-sm text-moss">
                    {eur(nextTier.price, 0)} from {nextTier.minQty} {product.unit}
                  </span>
                )}
              </div>

              <div className="mt-5 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-line ring-1 ring-line">
                {tiers.map((t, i) => (
                  <button
                    key={t.minQty}
                    type="button"
                    onClick={() => setQty(Math.max(product.moq, t.minQty))}
                    className={`px-3 py-2.5 text-left transition ${i === tierIdx ? "bg-ink text-paper" : "bg-paper hover:bg-bone"}`}
                  >
                    <div className="font-mono text-[10px] uppercase tracking-wider opacity-60">{t.minQty}{tiers[i + 1] ? `–${tiers[i + 1].minQty - 1}` : "+"} {product.unit}</div>
                    <div className="num text-sm">{eur(t.price, 0)}</div>
                  </button>
                ))}
              </div>

              {canOrder ? (
                <form action={addToCart} className="mt-6 space-y-4">
                  <input type="hidden" name="productId" value={product.id} />
                  <input type="hidden" name="color" value={color} />
                  <div className="flex items-end gap-3">
                    <div>
                      <label className="label">Quantity · min {product.moq}</label>
                      <div className="flex items-center rounded-full ring-1 ring-line">
                        <button type="button" onClick={() => setQty((q) => Math.max(product.moq, q - 1))} className="grid h-11 w-11 place-items-center rounded-full text-lg hover:bg-bone" aria-label="Less">−</button>
                        <input name="quantity" type="number" min={product.moq} value={qty} onChange={(e) => setQty(Math.max(product.moq, Number(e.target.value) || product.moq))} className="num w-14 bg-transparent text-center outline-none" />
                        <button type="button" onClick={() => setQty((q) => q + 1)} className="grid h-11 w-11 place-items-center rounded-full text-lg hover:bg-bone" aria-label="More">+</button>
                      </div>
                    </div>
                    <div className="flex-1 text-right">
                      <div className="eyebrow">Line total</div>
                      <div className="num text-2xl">{eur(unit * qty)}</div>
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-stone">
                      <span>Truck space · {volume.toFixed(2)} m³</span>
                      <span>{((volume / truckCapacity) * 100).toFixed(1)}% of a trailer</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-line">
                      <motion.div className="h-full rounded-full bg-clay" animate={{ width: `${Math.max(1.5, Math.min(100, (volume / truckCapacity) * 100))}%` }} transition={{ type: "spring", stiffness: 120, damping: 20 }} />
                    </div>
                  </div>
                  <div className="text-sm text-ink-3">Fabric: <b className="font-medium text-ink">{color}</b></div>
                  <div className="flex gap-2">
                    <button className="btn-primary flex-1 py-3">Add to truck</button>
                    <button name="goToCart" value="1" className="btn-accent flex-1 py-3">Add & review load</button>
                  </div>
                </form>
              ) : (
                <p className="mt-5 text-sm text-ink-3">Ordering is available for store accounts.</p>
              )}
            </section>

            {rrp > 0 && (
              <section className="panel p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="font-display text-2xl">Your margin</h3>
                  <span className="eyebrow">Edit to match your market</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">Retail price incl. VAT</label>
                    <input type="number" value={rrp} onChange={(e) => setRrp(Number(e.target.value) || 0)} className="input num" />
                  </div>
                  <div>
                    <label className="label">Your VAT %</label>
                    <input type="number" value={vat} onChange={(e) => setVat(Number(e.target.value) || 0)} className="input num" />
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-xl bg-line text-center ring-1 ring-line">
                  {[
                    ["Markup", `${markup.toFixed(2)}×`],
                    ["Gross margin", `${margin.toFixed(0)}%`],
                    [`Profit × ${qty}`, eur((netRetail - unit) * qty, 0)],
                  ].map(([k, v]) => (
                    <div key={k} className="bg-paper px-2 py-3">
                      <div className="num text-xl">{v}</div>
                      <div className="font-mono text-[9.5px] uppercase tracking-wider text-stone">{k}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </>
        ) : (
          <section className="grain relative overflow-hidden rounded-[20px] bg-ink p-7 text-bone">
            <div className="font-display text-3xl leading-tight">Trade prices, volume tiers and your margin unlock with a store account.</div>
            {isGuest ? (
              <div className="mt-6 flex gap-2">
                <Link href={`/login?next=/products/${product.slug}`} className="btn text-bone ring-1 ring-inset ring-white/25 hover:bg-white/10">Log in</Link>
                <Link href="/register" className="btn bg-paper text-ink hover:bg-bone">Open trade account</Link>
              </div>
            ) : (
              <p className="mt-4 text-sm text-stone-2">Your account is being reviewed. We&apos;ll email you as soon as it&apos;s approved.</p>
            )}
          </section>
        )}

        <section className="panel p-6">
          <h3 className="font-display text-2xl">If you order today</h3>
          <ol className="relative mt-5 space-y-5 border-l border-dashed border-stone-2 pl-6">
            {[
              ["Today", "Order + deposit", "Production is scheduled in our workshop."],
              [day(ready), "Ready", `${product.leadTimeDays} days to build, inspect and pack.`],
              [day(departs), truck ? `Leaves on ${truck.code}` : "Leaves Türkiye", "Export cleared and sealed at the workshop."],
              [day(arrives), "At your store", "EU customs handled by us. Unloaded at your door."],
            ].map(([d, t, s], i) => (
              <li key={i} className="relative">
                <span className={`absolute -left-[29px] top-1 h-2.5 w-2.5 rounded-full ${i === 3 ? "bg-clay" : "bg-ink"}`} />
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-medium">{t}</span>
                  <span className="num text-sm text-ink-3">{d}</span>
                </div>
                <div className="text-sm text-ink-3">{s}</div>
              </li>
            ))}
          </ol>
        </section>

        <section className="panel p-6">
          <h3 className="font-display text-2xl">What the price includes</h3>
          <ul className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
            {["Production & quality check", "Five-layer export packing", "Road freight to your door", "Export + EU customs clearance", "A.TR certificate — no EU import duty", "One EU invoice (VAT handled)"].map((x) => (
              <li key={x} className="flex items-start gap-2">
                <svg viewBox="0 0 16 16" className="mt-0.5 h-4 w-4 shrink-0 text-moss" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m3 8.5 3 3 7-7" /></svg>
                {x}
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
