import Link from "next/link";
import { Reveal, RevealGroup, RevealItem, SplitHeading } from "@/components/motion/Reveal";
import ProductCard from "@/components/ProductCard";
import { ViewsCanvas } from "@/components/three";
import { canSeePrices, currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseJson } from "@/lib/format";
import { toCard } from "@/lib/views";

export const metadata = { title: "Collection" };

export default async function CatalogPage({
  searchParams,
}: { searchParams: Promise<{ category?: string; tag?: string; q?: string; sort?: string }> }) {
  const { category, tag, q, sort } = await searchParams;
  const user = await currentUser();
  const showPrices = canSeePrices(user);

  const categories = await db.category.findMany({
    orderBy: { sortOrder: "asc" },
    include: { _count: { select: { products: { where: { active: true } } } } },
  });
  const active = categories.find((c) => c.slug === category);
  const all = await db.product.findMany({
    where: {
      active: true,
      ...(active ? { categoryId: active.id } : {}),
      ...(q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { shortDescription: { contains: q } }] } : {}),
    },
    include: { category: true },
    orderBy:
      sort === "price-asc" && showPrices ? { price: "asc" } : sort === "price-desc" && showPrices ? { price: "desc" } : [{ featured: "desc" }, { category: { sortOrder: "asc" } }, { name: "asc" }],
  });
  const tags = [...new Set(all.flatMap((p) => parseJson<string[]>(p.tags, [])))].sort();
  const products = (tag ? all.filter((p) => parseJson<string[]>(p.tags, []).includes(tag)) : all).map((p) => toCard(p, showPrices));
  const total = categories.reduce((s, c) => s + c._count.products, 0);

  const href = (params: Record<string, string | undefined>) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries({ category, tag, q, sort, ...params })) if (v) sp.set(k, v);
    const s = sp.toString();
    return `/catalog${s ? `?${s}` : ""}`;
  };

  return (
    <div className="pt-28 md:pt-32">
      <ViewsCanvas />
      <div className="container-page">
        <div className="grid gap-6 pb-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <Reveal className="eyebrow mb-4">{products.length} of {total} models{tag && ` · ${tag}`}</Reveal>
            <SplitHeading key={active?.slug ?? "all"} text={active ? active.name : "The *collection.*"} className="display text-[clamp(3rem,7vw,6rem)]" />
            {active?.description && <Reveal delay={0.2} className="mt-4 max-w-xl text-ink-3">{active.description}</Reveal>}
          </div>
          <form action="/catalog" className="flex gap-2">
            {category && <input type="hidden" name="category" value={category} />}
            {tag && <input type="hidden" name="tag" value={tag} />}
            <input name="q" defaultValue={q} placeholder="Search name or SKU" className="input w-52 rounded-full" />
            {showPrices && (
              <select name="sort" defaultValue={sort ?? ""} className="input w-36 rounded-full">
                <option value="">Featured</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
              </select>
            )}
            <button className="btn-primary">Search</button>
          </form>
        </div>
      </div>

      <div className="sticky top-[60px] z-[3] border-y border-line bg-bone/85 backdrop-blur-xl">
        <div className="container-page flex gap-2 overflow-x-auto py-3 [scrollbar-width:none]">
          <Link href={href({ category: undefined })} className={`chip shrink-0 ${!active ? "chip-active" : ""}`}>All <span className="num opacity-50">{total}</span></Link>
          {categories.map((c) => (
            <Link key={c.id} href={href({ category: c.slug })} className={`chip shrink-0 ${active?.id === c.id ? "chip-active" : ""}`}>
              {c.name} <span className="num opacity-50">{c._count.products}</span>
            </Link>
          ))}
          <span className="mx-2 w-px shrink-0 bg-line" />
          {tags.map((t) => (
            <Link key={t} href={href({ tag: tag === t ? undefined : t })} className={`chip shrink-0 ${tag === t ? "border-clay bg-clay text-paper" : ""}`}>
              {tag === t && "✕ "}{t}
            </Link>
          ))}
        </div>
      </div>

      <div className="container-page pt-12">
        {!showPrices && (
          <Reveal className="mb-12 flex flex-col justify-between gap-4 rounded-[22px] bg-ink p-6 text-bone sm:flex-row sm:items-center">
            <div>
              <div className="font-display text-2xl">Trade prices are for registered stores.</div>
              <div className="text-sm text-stone-2">{user ? "Your account is being reviewed — usually within a business day." : "Free to join. We verify your VAT number, then prices unlock."}</div>
            </div>
            {!user && (
              <div className="flex gap-2">
                <Link href="/login?next=/catalog" className="btn text-bone ring-1 ring-inset ring-white/25 hover:bg-white/10">Log in</Link>
                <Link href="/register" className="btn bg-paper text-ink hover:bg-bone">Open account</Link>
              </div>
            )}
          </Reveal>
        )}
        {products.length === 0 ? (
          <div className="py-24 text-center">
            <div className="font-display text-4xl">Nothing matches.</div>
            <Link href="/catalog" className="btn-outline mt-6">Clear filters</Link>
          </div>
        ) : (
          <RevealGroup key={`${category}-${tag}-${q}-${sort}`} className="grid gap-x-5 gap-y-14 sm:grid-cols-2 xl:grid-cols-3">
            {products.map((p, i) => (
              <RevealItem key={p.id}><ProductCard p={p} index={i} /></RevealItem>
            ))}
          </RevealGroup>
        )}
      </div>
    </div>
  );
}
