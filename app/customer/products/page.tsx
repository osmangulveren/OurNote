import Link from "next/link";
import Image from "next/image";
import { ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { formatTRY, D } from "@/lib/money";
import { effectiveUnitPrice, loadCustomerPricingContext } from "@/lib/pricing";
import ViewModeToggle, { parseView } from "@/components/ViewModeToggle";

const CATEGORY_LABEL: Record<string, string> = {
  KOLTUK: "Tekli Koltuk", KANEPE: "Kanepe / Set", SOMINE: "Şömine",
};
const TABS = [
  { value: "ALL", label: "Tümü" },
  { value: "KANEPE", label: "Kanepe" },
  { value: "KOLTUK", label: "Koltuk" },
  { value: "SOMINE", label: "Şömine" },
];
const VALID_CATS = new Set(["KOLTUK", "KANEPE", "SOMINE"]);

export default async function CustomerProductsPage({ searchParams }: { searchParams: { cat?: string; view?: string } }) {
  const session = await requireCustomer();
  const userId = session.user!.id;
  const cat = searchParams.cat && VALID_CATS.has(searchParams.cat)
    ? (searchParams.cat as ProductCategory)
    : undefined;
  const view = parseView(searchParams.view);

  const [products, ctx] = await Promise.all([
    prisma.product.findMany({
      where: { isActive: true, ...(cat ? { category: cat } : {}) },
      orderBy: [{ category: "asc" }, { name: "asc" }],
      include: { images: { where: { isCover: true }, take: 1 } },
    }),
    loadCustomerPricingContext(prisma, userId),
  ]);

  const activeTab = cat ?? "ALL";

  return (
    <div className="space-y-8">
      <div className="text-center py-8">
        <h1 className="text-4xl font-semibold tracking-tight">Katalog</h1>
        <p className="text-slate-600 mt-2">Her detayıyla, sana özel.</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <nav className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.value === activeTab;
            const href = t.value === "ALL"
              ? `/customer/products${view === "list" ? "?view=list" : ""}`
              : `/customer/products?cat=${t.value}${view === "list" ? "&view=list" : ""}`;
            return (
              <Link
                key={t.value}
                href={href}
                prefetch={false}
                className={`text-sm px-4 py-1.5 rounded-full whitespace-nowrap transition ${active ? "bg-slate-900 text-white" : "text-slate-700 hover:bg-slate-100"}`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
        <ViewModeToggle mode={view} baseUrl="/customer/products" searchParams={{ cat: cat ?? undefined }} />
      </div>

      {products.length === 0 ? (
        <p className="text-slate-500 text-center py-10">Bu kategoride ürün yok.</p>
      ) : view === "grid" ? (
        <GridView products={products} ctx={ctx} />
      ) : (
        <ListView products={products} ctx={ctx} />
      )}
    </div>
  );
}

function GridView({ products, ctx }: { products: any[]; ctx: any }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-12">
      {products.map((p) => {
        const cover = p.images[0]?.url;
        const available = Math.max(0, p.stockQuantity - p.reservedQuantity);
        const effective = effectiveUnitPrice(p.price as any, p.id, ctx);
        const isDiscounted = effective.lt(new D(p.price as any));
        return (
          <Link key={p.id} href={`/customer/products/${p.id}`} className="group block">
            <div className="aspect-[4/5] relative bg-slate-100 rounded-3xl overflow-hidden">
              {cover ? (
                <Image src={cover} alt={p.name} fill className="object-cover transition group-hover:scale-105" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
              ) : null}
              {available <= 3 && available > 0 ? (
                <span className="absolute top-3 right-3 text-[10px] font-medium uppercase tracking-wide bg-amber-500 text-white px-2 py-0.5 rounded-full">
                  Son {available}
                </span>
              ) : available === 0 ? (
                <span className="absolute top-3 right-3 text-[10px] font-medium uppercase tracking-wide bg-slate-700 text-white px-2 py-0.5 rounded-full">
                  Tükendi
                </span>
              ) : null}
            </div>
            <div className="text-center pt-4 px-2">
              <p className="text-xs uppercase tracking-[0.15em] text-slate-500">{CATEGORY_LABEL[p.category]}</p>
              <h3 className="text-lg font-semibold mt-1 group-hover:underline">{p.name}</h3>
              {p.collection ? <p className="text-xs text-slate-500 mt-0.5">{p.collection}</p> : null}
              <div className="mt-2 text-sm">
                {isDiscounted ? (
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-slate-400 line-through">{formatTRY(p.price as any)}</span>
                    <span className="font-semibold text-emerald-700">{formatTRY(effective)}</span>
                  </div>
                ) : (
                  <span className="font-semibold">{formatTRY(effective)}</span>
                )}
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ListView({ products, ctx }: { products: any[]; ctx: any }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <ul className="divide-y divide-slate-100">
        {products.map((p) => {
          const cover = p.images[0]?.url;
          const available = Math.max(0, p.stockQuantity - p.reservedQuantity);
          const effective = effectiveUnitPrice(p.price as any, p.id, ctx);
          const isDiscounted = effective.lt(new D(p.price as any));
          return (
            <li key={p.id}>
              <Link href={`/customer/products/${p.id}`} className="flex items-center gap-4 p-3 hover:bg-slate-50">
                <div className="w-20 h-20 relative flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden">
                  {cover ? <Image src={cover} alt="" fill className="object-cover" sizes="80px" unoptimized /> : null}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{CATEGORY_LABEL[p.category]}</p>
                  <h3 className="font-semibold truncate">{p.name}</h3>
                  <p className="text-xs text-slate-500 truncate">{p.collection ?? ""}{p.fabricColor ? ` · ${p.fabricColor}` : ""}{p.warrantyMonths ? ` · ${p.warrantyMonths} ay garanti` : ""}</p>
                </div>
                <div className="text-right">
                  {isDiscounted ? (
                    <>
                      <div className="text-xs text-slate-400 line-through">{formatTRY(p.price as any)}</div>
                      <div className="font-semibold text-emerald-700">{formatTRY(effective)}</div>
                    </>
                  ) : (
                    <div className="font-semibold">{formatTRY(effective)}</div>
                  )}
                  <div className="text-xs text-slate-500">Stok {available}</div>
                </div>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
