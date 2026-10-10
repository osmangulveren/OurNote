import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveal, RevealGroup, RevealItem, SplitHeading } from "@/components/motion/Reveal";
import ProductCard from "@/components/ProductCard";
import { ViewsCanvas } from "@/components/three";
import { canSeePrices, currentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { fabricOf, FABRIC_KIND_LABEL } from "@/lib/fabrics";
import { parseJson } from "@/lib/format";
import { bookableDepartures } from "@/lib/orders";
import { tiersOf } from "@/lib/pricing";
import { shapeOf } from "@/lib/shape";
import { toCard } from "@/lib/views";
import ProductClient from "./ProductClient";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const p = await db.product.findUnique({ where: { slug: (await params).slug } });
  return { title: p?.name ?? "Product" };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await db.product.findUnique({ where: { slug }, include: { category: true } });
  if (!product || !product.active) notFound();
  const user = await currentUser();
  const showPrices = canSeePrices(user);
  const canOrder = user?.role === "BUYER" && user.company?.status === "APPROVED";
  const colors = parseJson<string[]>(product.colors, []);
  const specs = parseJson<{ label: string; value: string }[]>(product.specs, []);
  const tags = parseJson<string[]>(product.tags, []);
  const [departures, related] = await Promise.all([
    bookableDepartures(),
    db.product.findMany({ where: { active: true, categoryId: product.categoryId, id: { not: product.id } }, include: { category: true }, take: 3 }),
  ]);
  const kinds = [...new Set(colors.map((c) => fabricOf(c).kind))];

  const facts = [
    ["Dimensions", product.dimensions],
    ["Upholstery", product.material],
    ["Minimum order", `${product.moq} ${product.unit}`],
    ["Packages per unit", String(product.unitsPerCarton)],
    ["Packed volume", product.volumeM3 ? `${product.volumeM3} m³` : "—"],
    ["Packed weight", product.weightKg ? `${product.weightKg} kg` : "—"],
    ["Lead time", `${product.leadTimeDays} days`],
    ...specs.map((s) => [s.label, s.value]),
  ];

  return (
    <div className="pt-24 md:pt-28">
      <ViewsCanvas />
      <div className="container-page">
        <nav className="mb-6 flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-stone">
          <Link href="/catalog" className="link-underline">Collection</Link>
          <span>/</span>
          <Link href={`/catalog?category=${product.category.slug}`} className="link-underline">{product.category.name}</Link>
          <span>/</span>
          <span className="text-ink-2">{product.sku}</span>
        </nav>
        <div className="mb-8 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <SplitHeading text={product.name} className="display text-[clamp(3rem,7vw,6.2rem)]" />
            <Reveal delay={0.25} className="mt-4 max-w-2xl text-lg text-ink-3">{product.shortDescription}</Reveal>
          </div>
          <Reveal delay={0.35} className="flex flex-wrap gap-1.5 md:justify-end">
            {tags.map((t) => (
              <Link key={t} href={`/catalog?tag=${encodeURIComponent(t)}`} className="chip">{t}</Link>
            ))}
          </Reveal>
        </div>

        <ProductClient
          product={{ id: product.id, slug: product.slug, modelUrl: product.modelUrl, name: product.name, sku: product.sku, unit: product.unit, moq: product.moq, volumeM3: product.volumeM3, leadTimeDays: product.leadTimeDays, rrp: product.rrp }}
          shape={shapeOf(product)}
          colors={colors}
          tiers={showPrices ? tiersOf(product) : null}
          canOrder={canOrder}
          isGuest={!user}
          truckCapacity={config.truckCapacityCbm}
          departures={departures.map((d) => ({ code: d.code, departAt: d.plannedDepartureAt?.toISOString() ?? null, eta: d.eta?.toISOString() ?? null }))}
          transitDays={config.transitDays}
        />

        <section className="mt-24 grid gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <Reveal className="eyebrow mb-4">Specification</Reveal>
            <h2 className="display text-5xl">Built to be shipped.</h2>
            {product.description && <Reveal className="mt-6 whitespace-pre-line leading-relaxed text-ink-3">{product.description}</Reveal>}
            <div className="mt-8 flex flex-wrap gap-2">
              <Link href={`/products/${product.slug}/sheet`} target="_blank" className="btn-outline">Product sheet for your floor ↗</Link>
              <Link href="/fabrics" className="btn-ghost">Order fabric swatches</Link>
            </div>
          </div>
          <RevealGroup className="grid border-t border-line sm:grid-cols-2 sm:gap-x-10">
            {facts.map(([k, v]) => (
              <RevealItem key={k} className="flex justify-between gap-6 border-b border-line py-3.5 text-sm">
                <span className="text-stone">{k}</span>
                <span className="text-right">{v}</span>
              </RevealItem>
            ))}
          </RevealGroup>
        </section>

        <section className="mt-24">
          <Reveal className="eyebrow mb-4">Fabrics for this model</Reveal>
          <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
            <div className="space-y-2 text-sm text-ink-3">
              {kinds.map((k) => <div key={k}>{FABRIC_KIND_LABEL[k]}</div>)}
            </div>
            <RevealGroup className="flex flex-wrap gap-4">
              {colors.map((c) => (
                <RevealItem key={c} className="text-center">
                  <div className="h-20 w-20 rounded-full ring-1 ring-line" style={{ background: fabricOf(c).hex }} />
                  <div className="mt-2 w-20 text-xs text-ink-3">{c}</div>
                </RevealItem>
              ))}
            </RevealGroup>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-28">
            <div className="mb-10 flex items-end justify-between">
              <h2 className="display text-5xl">Also in {product.category.name}</h2>
              <Link href={`/catalog?category=${product.category.slug}`} className="btn-outline">View all</Link>
            </div>
            <RevealGroup className="grid gap-x-5 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r, i) => (
                <RevealItem key={r.id}><ProductCard p={toCard(r, showPrices)} index={i} /></RevealItem>
              ))}
            </RevealGroup>
          </section>
        )}
      </div>
    </div>
  );
}
