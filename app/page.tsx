import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { canSeePrices, currentUser } from "@/lib/auth";
import { config } from "@/lib/config";
import { db } from "@/lib/db";
import { money, parseJson } from "@/lib/format";

const steps = [
  { t: "Choose", d: "Browse the catalog and add products in wholesale quantities." },
  { t: "Pay", d: "Pay by card or bank transfer. Intra-EU B2B orders are VAT reverse-charged." },
  { t: "We ship", d: "Produced in Türkiye, loaded on our trucks, customs handled by us." },
  { t: "Track", d: "Follow your truck live – from the workshop to your store's door." },
];

export default async function Home() {
  const user = await currentUser();
  const showPrices = canSeePrices(user);
  const [categories, featured] = await Promise.all([
    db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: { where: { active: true } } } } } }),
    db.product.findMany({ where: { active: true, featured: true }, include: { category: true }, take: 4 }),
  ]);

  return (
    <>
      <section className="bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 text-white">
        <div className="container-page grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div className="flex flex-col justify-center gap-6">
            <span className="badge w-fit bg-white/15 text-white">B2B wholesale · EU delivery</span>
            <h1 className="text-4xl font-bold leading-tight md:text-5xl">
              Furniture for your store, delivered direct from the workshop.
            </h1>
            <p className="text-lg text-brand-100">
              {config.brandName} supplies European retailers with upholstered furniture made in Türkiye.
              No warehouse in between: we produce, ship and clear customs, and the truck unloads at your store.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/catalog" className="btn bg-white text-brand-700 hover:bg-brand-50">Browse catalog</Link>
              {!user && <Link href="/register" className="btn border border-white/40 text-white hover:bg-white/10">Open a trade account</Link>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 self-center">
            {[
              ["Direct", "from workshop to store"],
              ["0% VAT", "reverse charge for EU businesses"],
              ["Live", "truck tracking"],
              ["EUR", "prices, volume discounts"],
            ].map(([a, b]) => (
              <div key={a} className="rounded-xl bg-white/10 p-5 backdrop-blur">
                <div className="text-2xl font-bold">{a}</div>
                <div className="text-sm text-brand-100">{b}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <h2 className="mb-6 text-xl font-bold">How it works</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {steps.map((s, i) => (
            <div key={s.t} className="card p-5">
              <div className="mb-3 grid h-8 w-8 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">{i + 1}</div>
              <div className="font-semibold">{s.t}</div>
              <p className="muted mt-1">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container-page pb-14">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-bold">Categories</h2>
          <Link href="/catalog" className="text-sm font-semibold text-brand-600">View all products →</Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {categories.map((c) => (
            <Link key={c.id} href={`/catalog?category=${c.slug}`} className="card group p-4 transition hover:border-brand-500">
              <div className="mb-3 aspect-[4/3] overflow-hidden rounded-lg">
                <ProductImage name={c.name} category={c.slug} />
              </div>
              <div className="font-semibold group-hover:text-brand-600">{c.name}</div>
              <div className="muted">{c._count.products} products</div>
            </Link>
          ))}
        </div>
      </section>

      {featured.length > 0 && (
        <section className="container-page pb-6">
          <h2 className="mb-6 text-xl font-bold">Best sellers</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {featured.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="card overflow-hidden transition hover:shadow-md">
                <div className="aspect-[4/3]">
                  <ProductImage src={parseJson<string[]>(p.images, [])[0]} name={p.name} category={p.category.slug} />
                </div>
                <div className="p-4">
                  <div className="text-xs text-slate-500">{p.category.name}</div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="mt-1 text-sm">
                    {showPrices ? <span className="font-bold text-brand-700">from {money(p.price)}</span> : <span className="text-slate-500">Log in for prices</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
