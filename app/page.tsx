import Link from "next/link";
import Configurator from "@/components/Configurator";
import Departures from "@/components/Departures";
import CountUp from "@/components/motion/CountUp";
import Marquee from "@/components/motion/Marquee";
import { Reveal, RevealGroup, RevealItem, SplitHeading } from "@/components/motion/Reveal";
import ProductCard from "@/components/ProductCard";
import { ModelThumb, ViewsCanvas } from "@/components/three";
import { canSeePrices, currentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { fabricOf } from "@/lib/fabrics";
import { date, parseJson } from "@/lib/format";
import { bookableDepartures } from "@/lib/orders";
import { shapeOf } from "@/lib/shape";
import { toCard } from "@/lib/views";

const problems = [
  { n: "01", pain: "Freight that costs more than the sofa", fix: "Prices are delivered.", body: "Every price includes production, export packing, road freight and EU customs clearance to your door. The invoice comes from an EU company in Romania — no import paperwork on your side." },
  { n: "02", pain: "Container minimums you can't fill", fix: "Share a truck.", body: "Book space on a scheduled truck and pay for the cubic metres you use. Most models start at two to six pieces." },
  { n: "03", pain: "Cash locked up for months", fix: "30% to start.", body: `Pay a ${config.depositPercent}% deposit to start production and the balance just before your goods are loaded.` },
  { n: "04", pain: "Silence after you pay", fix: "Watch it move.", body: "Production, loading, the border at Kapıkule, the road — every stage is posted to your order with the truck plate and ETA." },
  { n: "05", pain: "Damage, then an email war", fix: "Claims in two clicks.", body: "Five-layer cartons with corner guards. If something arrives wrong, report the piece straight from the order." },
];

export default async function Home() {
  const user = await currentUser();
  const showPrices = canSeePrices(user);
  const [categories, featuredRaw, departures, hero, ratioRows] = await Promise.all([
    db.category.findMany({
      orderBy: { sortOrder: "asc" },
      include: { products: { where: { active: true }, orderBy: [{ featured: "desc" }, { name: "asc" }] } },
    }),
    db.product.findMany({ where: { active: true, featured: true }, include: { category: true }, take: 6 }),
    bookableDepartures(),
    db.product.findFirst({ where: { active: true, featured: true, shape: { contains: "openDepth" } }, orderBy: { createdAt: "asc" } }),
    db.product.findMany({ where: { active: true, rrp: { gt: 0 } }, select: { price: true, rrp: true } }),
  ]);
  const featured = featuredRaw.map((p) => toCard(p, showPrices));
  const avgMarkup = ratioRows.length ? ratioRows.reduce((s, p) => s + p.rrp / 1.2 / p.price, 0) / ratioRows.length : 0;
  const heroShape = hero ? shapeOf(hero) : null;
  const heroColors = hero ? parseJson<string[]>(hero.colors, []) : [];
  const next = departures[0];

  return (
    <>
      <ViewsCanvas />

      {/* ---------------- Hero */}
      <section className="relative overflow-hidden pt-28 md:pt-32">
        <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
        <div className="container-page relative grid items-center gap-6 lg:grid-cols-[1fr_1.15fr]">
          <div className="relative z-[2] py-6">
            <Reveal className="eyebrow mb-6 flex items-center gap-3">
              <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-clay" />
              Wholesale · Made in Anatolia · Delivered across the EU
            </Reveal>
            <SplitHeading text={"Sofas that sell,\ndelivered to *your* *floor.*"} className="display text-[clamp(3.2rem,7.2vw,6.6rem)]" />
            <Reveal delay={0.5} className="mt-7 max-w-md text-lg leading-relaxed text-ink-3">
              Upholstered furniture from Turkish workshops under one brand, at delivered prices.
              Book space on a shared truck, pay {config.depositPercent}% to start, and follow it to your door.
            </Reveal>
            <Reveal delay={0.65} className="mt-9 flex flex-wrap items-center gap-3">
              <Link href="/catalog" className="btn-primary px-6 py-3">Browse the collection</Link>
              {!user && <Link href="/register" className="btn-outline px-6 py-3">Open a trade account</Link>}
            </Reveal>
            {next && (
              <Reveal delay={0.8} className="mt-12 flex max-w-md items-center gap-4 border-t border-line pt-5 text-sm">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-paper">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M2 6h12v10H2zM14 9h4l3 3v4h-7z" /></svg>
                </span>
                <span>
                  Next truck leaves <b className="font-medium">{date(next.plannedDepartureAt)}</b> for {next.route.split("→").at(-1)?.trim()} —{" "}
                  <span className="num">{next.free.toFixed(0)} m³</span> still free.{" "}
                  <Link href="/departures" className="link-underline text-clay">See trucks</Link>
                </span>
              </Reveal>
            )}
          </div>
          {heroShape && (
            <Reveal delay={0.2} y={40} className="relative z-[2] -mx-5 sm:mx-0">
              <Configurator shape={heroShape} colors={heroColors.length ? heroColors : ["Moss Velvet"]} initialColor={heroColors.find((c) => c.includes("Moss")) ?? heroColors[0]} stageClassName="h-[460px] sm:h-[560px] lg:h-[640px]" modelUrl={hero!.modelUrl || undefined} name={hero!.name} />
              <Link href={`/products/${hero!.slug}`} className="absolute left-4 top-16 z-[3] rounded-2xl bg-paper/80 px-4 py-3 ring-1 ring-line backdrop-blur transition hover:ring-ink/30 sm:left-6">
                <div className="eyebrow">{hero!.sku}</div>
                <div className="font-display text-2xl leading-none">{hero!.name}</div>
              </Link>
            </Reveal>
          )}
        </div>
      </section>

      {/* ---------------- Marquee */}
      <section className="relative z-[2] mt-10 bg-ink py-5 font-display text-3xl text-bone">
        <Marquee items={["Delivered prices", "Shared trucks", `${config.depositPercent}% deposit`, "Live tracking", "Fabric swatch kits", "One invoice, EU VAT handled", "Made to order in 3–4 weeks"]} />
      </section>

      {/* ---------------- Problems → answers */}
      <section className="container-page relative z-[2] py-28">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <Reveal className="eyebrow mb-5">Why stores switch</Reveal>
            <SplitHeading as="h2" text={"Importing furniture,\nwithout the *usual* pain."} className="display text-[clamp(2.5rem,4.5vw,4.2rem)]" />
            <Reveal delay={0.3} className="mt-6 max-w-sm text-ink-3">
              We built this for independent furniture stores that want factory prices without becoming freight forwarders.
            </Reveal>
          </div>
          <RevealGroup className="border-t border-line">
            {problems.map((p) => (
              <RevealItem key={p.n}>
                <div className="group grid gap-3 border-b border-line py-8 sm:grid-cols-[60px_1fr]">
                  <span className="font-mono text-xs text-stone">{p.n}</span>
                  <div>
                    <div className="text-sm text-stone line-through decoration-clay/60">{p.pain}</div>
                    <div className="mt-2 font-display text-4xl leading-none transition-colors duration-500 group-hover:text-clay">{p.fix}</div>
                    <p className="mt-3 max-w-xl text-ink-3">{p.body}</p>
                  </div>
                </div>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- Collection */}
      <section className="container-page relative pb-28">
        <div className="mb-10 flex items-end justify-between gap-6">
          <div>
            <Reveal className="eyebrow mb-4">The collection</Reveal>
            <SplitHeading as="h2" text="Six families, one *brand.*" className="display text-[clamp(2.5rem,4.5vw,4.2rem)]" />
          </div>
          <Link href="/catalog" className="btn-outline hidden sm:inline-flex">All products</Link>
        </div>
        <RevealGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c, i) => {
            const rep = c.products[0];
            if (!rep) return null;
            const f = fabricOf(parseJson<string[]>(rep.colors, [])[i % 2] ?? "Sand Velvet");
            return (
              <RevealItem key={c.id}>
                <Link href={`/catalog?category=${c.slug}`} className="group flex h-full flex-col overflow-hidden rounded-[22px] bg-paper ring-1 ring-line transition hover:ring-ink/25">
                  <div className="relative aspect-[4/3]">
                    <div className="bg-grid absolute inset-0 opacity-50" />
                    <ModelThumb shape={shapeOf(rep)} hex={f.hex} kind={f.kind} className="absolute inset-0" modelUrl={rep.modelUrl || undefined} />
                    <span className="absolute left-5 top-4 font-mono text-[10px] tracking-wider text-stone">0{i + 1}</span>
                  </div>
                  <div className="flex items-end justify-between border-t border-line p-5">
                    <div>
                      <div className="font-display text-3xl leading-none">{c.name}</div>
                      <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-stone">{c.products.length} models</div>
                    </div>
                    <span className="grid h-10 w-10 place-items-center rounded-full bg-ink text-paper transition-transform duration-500 group-hover:-rotate-45">→</span>
                  </div>
                </Link>
              </RevealItem>
            );
          })}
        </RevealGroup>
      </section>

      {/* ---------------- What sells */}
      <section className="relative z-[2] bg-paper py-28">
        <div className="container-page">
          <Reveal className="eyebrow mb-4">What end customers are buying</Reveal>
          <SplitHeading as="h2" text={"Stock what's *moving.*"} className="display mb-14 text-[clamp(2.5rem,4.5vw,4.2rem)]" />
          <RevealGroup className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Beds that hide in living rooms", body: "Smaller city flats mean the sofa is also the guest room. Pull-out and click-clack sofa beds with storage are the easiest upsell on the floor.", tag: "Sofa bed", swatches: ["Sand Velvet", "Graphite Velvet", "Taupe Velvet"] },
              { title: "Curves, in bouclé", body: "Rounded arms, sculpted backs and nubby bouclé. Statement pieces that pull people into the store.", tag: "Curved", swatches: ["Ecru Bouclé", "Oat Bouclé", "Stone Bouclé"] },
              { title: "Earth tones over grey", body: "Terracotta, moss and taupe are replacing cool greys. Every model comes in the full warm palette.", tag: "Storage", swatches: ["Terracotta Velvet", "Moss Velvet", "Olive Linen"] },
            ].map((t) => (
              <RevealItem key={t.title}>
                <Link href={`/catalog?tag=${encodeURIComponent(t.tag)}`} className="group flex h-full flex-col justify-between rounded-[22px] bg-bone p-7 ring-1 ring-line transition hover:ring-ink/25">
                  <div className="mb-16 flex gap-2">
                    {t.swatches.map((s) => (
                      <span key={s} className="h-14 w-14 rounded-full transition-transform duration-700 group-hover:-translate-y-1 group-hover:rotate-12" style={{ background: fabricOf(s).hex }} title={s} />
                    ))}
                  </div>
                  <div>
                    <div className="font-display text-3xl leading-none">{t.title}</div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-3">{t.body}</p>
                    <div className="mt-6 font-mono text-[11px] uppercase tracking-wider">Shop “{t.tag}” →</div>
                  </div>
                </Link>
              </RevealItem>
            ))}
          </RevealGroup>
        </div>
      </section>

      {/* ---------------- Featured */}
      <section className="container-page relative py-28">
        <div className="mb-12 flex items-end justify-between">
          <div>
            <Reveal className="eyebrow mb-4">Best sellers</Reveal>
            <SplitHeading as="h2" text="On most trucks." className="display text-[clamp(2.5rem,4.5vw,4.2rem)]" />
          </div>
          <Link href="/catalog" className="btn-outline">See all</Link>
        </div>
        <RevealGroup className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((p, i) => (
            <RevealItem key={p.id}><ProductCard p={p} index={i} /></RevealItem>
          ))}
        </RevealGroup>
      </section>

      {/* ---------------- Trucks */}
      <section className="relative z-[2] bg-ink py-28 text-bone">
        <div className="container-page">
          <div className="mb-10 grid gap-6 md:grid-cols-2 md:items-end">
            <div>
              <Reveal className="eyebrow mb-4 text-stone-2">Shared trucks</Reveal>
              <SplitHeading as="h2" text={"Don't fill a truck.\n*Share* one."} className="display text-[clamp(2.5rem,4.5vw,4.2rem)]" />
            </div>
            <Reveal delay={0.2} className="max-w-md text-stone-2 md:justify-self-end">
              Pick a scheduled departure at checkout and pay only for the space your order takes. Your pieces are produced to meet the truck.
            </Reveal>
          </div>
          <Departures items={departures} dark />
        </div>
      </section>

      {/* ---------------- Margin */}
      <section className="container-page relative z-[2] grid gap-12 py-28 lg:grid-cols-2 lg:items-center">
        <div>
          <Reveal className="eyebrow mb-4">The maths</Reveal>
          <SplitHeading as="h2" text={"Room for your *margin.*"} className="display text-[clamp(2.5rem,4.5vw,4.2rem)]" />
          <Reveal delay={0.2} className="mt-6 max-w-md text-ink-3">
            Every product has a suggested retail price for European stores. Trade customers see their exact markup on each product page, before ordering.
          </Reveal>
        </div>
        <Reveal delay={0.1} className="grid grid-cols-2 gap-px overflow-hidden rounded-[22px] bg-line ring-1 ring-line">
          {[
            { k: "Average markup to RRP", v: <CountUp value={avgMarkup} decimals={1} suffix="×" /> },
            { k: "Deposit to start production", v: <CountUp value={config.depositPercent} suffix="%" /> },
            { k: "Production lead time", v: <><CountUp value={3} />–4 wk</> },
            { k: "Workshop to EU store", v: <><CountUp value={config.transitDays} />–9 days</> },
          ].map((s) => (
            <div key={s.k} className="bg-paper p-7">
              <div className="font-display text-6xl leading-none">{s.v}</div>
              <div className="mt-3 font-mono text-[10px] uppercase tracking-wider text-stone">{s.k}</div>
            </div>
          ))}
        </Reveal>
      </section>

      {/* ---------------- CTA */}
      {!user && (
        <section className="container-page relative z-[2]">
          <Reveal className="grain relative overflow-hidden rounded-[28px] bg-clay px-8 py-20 text-paper sm:px-16">
            <div className="relative max-w-2xl">
              <div className="font-display text-[clamp(2.5rem,5vw,4.5rem)] leading-[0.95]">Trade prices, one form away.</div>
              <p className="mt-5 max-w-md text-clay-3">Tell us about your store. We check your VAT number and usually approve within a business day.</p>
              <Link href="/register" className="btn mt-8 bg-paper px-6 py-3 text-ink hover:bg-bone">Open a trade account</Link>
            </div>
          </Reveal>
        </section>
      )}
    </>
  );
}
