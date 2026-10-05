import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { canSeePrices, currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, parseJson } from "@/lib/format";

export const metadata = { title: "Catalog" };

export default async function CatalogPage({
  searchParams,
}: { searchParams: Promise<{ category?: string; q?: string; sort?: string }> }) {
  const { category, q, sort } = await searchParams;
  const user = await currentUser();
  const showPrices = canSeePrices(user);

  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
  const active = categories.find((c) => c.slug === category);
  const products = await db.product.findMany({
    where: {
      active: true,
      ...(active ? { categoryId: active.id } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { shortDescription: { contains: q } }] } : {}),
    },
    include: { category: true },
    orderBy:
      sort === "price-asc" ? { price: "asc" } : sort === "price-desc" ? { price: "desc" } : [{ featured: "desc" }, { name: "asc" }],
  });
  const total = categories.reduce((s, c) => s + c._count.products, 0);
  const href = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    const merged = { category, q, sort, ...params };
    for (const [k, v] of Object.entries(merged)) if (v) sp.set(k, v);
    const s = sp.toString();
    return `/catalog${s ? `?${s}` : ""}`;
  };

  return (
    <div className="container-page grid gap-8 py-8 lg:grid-cols-[220px_1fr]">
      <aside>
        <div className="label mb-3">Categories</div>
        <nav className="flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:gap-1 lg:overflow-visible">
          <Link href={href({ category: undefined })} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${!active ? "bg-brand-600 font-semibold text-white" : "hover:bg-slate-100"}`}>
            All products <span className="opacity-60">({total})</span>
          </Link>
          {categories.map((c) => (
            <Link key={c.id} href={href({ category: c.slug })} className={`whitespace-nowrap rounded-lg px-3 py-2 text-sm ${active?.id === c.id ? "bg-brand-600 font-semibold text-white" : "hover:bg-slate-100"}`}>
              {c.name} <span className="opacity-60">({c._count.products})</span>
            </Link>
          ))}
        </nav>
      </aside>

      <section>
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="h1">{active?.name ?? "All products"}</h1>
            {active?.description && <p className="muted mt-1">{active.description}</p>}
          </div>
          <form className="flex gap-2" action="/catalog">
            {category && <input type="hidden" name="category" value={category} />}
            <input name="q" defaultValue={q} placeholder="Search name or SKU…" className="input w-48" />
            <select name="sort" defaultValue={sort ?? ""} className="input w-40">
              <option value="">Recommended</option>
              {showPrices && <option value="price-asc">Price: low to high</option>}
              {showPrices && <option value="price-desc">Price: high to low</option>}
            </select>
            <button className="btn-outline">Go</button>
          </form>
        </div>

        {!showPrices && (
          <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 p-4 text-sm text-brand-900">
            Wholesale prices are visible to approved trade customers.{" "}
            {user ? "Your account is under review." : <><Link href="/login" className="font-semibold underline">Log in</Link> or <Link href="/register" className="font-semibold underline">open a trade account</Link>.</>}
          </div>
        )}

        {products.length === 0 ? (
          <div className="card p-10 text-center text-slate-500">No products found.</div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p) => (
              <Link key={p.id} href={`/products/${p.slug}`} className="card group flex flex-col overflow-hidden transition hover:shadow-md">
                <div className="aspect-[4/3] overflow-hidden">
                  <ProductImage src={parseJson<string[]>(p.images, [])[0]} name={p.name} category={p.category.slug} className="transition group-hover:scale-105" />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>{p.category.name}</span>
                    <span className="font-mono">{p.sku}</span>
                  </div>
                  <div className="font-semibold leading-snug group-hover:text-brand-600">{p.name}</div>
                  <p className="line-clamp-2 text-sm text-slate-500">{p.shortDescription}</p>
                  <div className="mt-auto flex items-end justify-between pt-2">
                    <div>
                      {showPrices ? (
                        <>
                          <div className="text-lg font-bold text-brand-700">{money(p.price)}</div>
                          <div className="text-xs text-slate-500">per {p.unit}, excl. VAT</div>
                        </>
                      ) : (
                        <div className="text-sm font-semibold text-slate-500">Log in for price</div>
                      )}
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <div>MOQ <b className="text-slate-700">{p.moq} {p.unit}</b></div>
                      <div>{p.leadTimeDays} days lead time</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
