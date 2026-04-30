import Link from "next/link";
import Image from "next/image";
import { ProductCategory } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { formatTRY, formatPercent, D } from "@/lib/money";
import { effectiveUnitPrice, loadCustomerPricingContext } from "@/lib/pricing";
import AddToCartForm from "./AddToCartForm";

const CATEGORY_LABEL: Record<string, string> = {
  KOLTUK: "Tekli Koltuk",
  KANEPE: "Kanepe / Set",
  SOMINE: "Şömine",
};

const TABS: Array<{ value: string; label: string }> = [
  { value: "ALL", label: "Tümü" },
  { value: "KOLTUK", label: "Tekli Koltuk" },
  { value: "KANEPE", label: "Kanepe / Set" },
  { value: "SOMINE", label: "Şömine" },
];
const VALID_CATS = new Set(["KOLTUK", "KANEPE", "SOMINE"]);

export default async function CustomerProductsPage({ searchParams }: { searchParams: { cat?: string } }) {
  const session = await requireCustomer();
  const userId = session.user!.id;
  const cat = searchParams.cat && VALID_CATS.has(searchParams.cat)
    ? (searchParams.cat as ProductCategory)
    : undefined;

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
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Ürün Kataloğu</h1>
        <nav className="flex gap-2 flex-wrap">
          {TABS.map((t) => {
            const active = t.value === activeTab;
            const href = t.value === "ALL" ? "/customer/products" : `/customer/products?cat=${t.value}`;
            return (
              <Link
                key={t.value}
                href={href}
                className={`text-sm px-3 py-1.5 rounded-lg border ${active ? "bg-slate-900 text-white border-slate-900" : "bg-white text-slate-700 border-slate-300 hover:border-slate-400"}`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.length === 0 ? (
          <p className="text-slate-500">Bu kategoride ürün yok.</p>
        ) : products.map((p) => {
          const cover = p.images[0]?.url;
          const available = Math.max(0, p.stockQuantity - p.reservedQuantity);
          const effective = effectiveUnitPrice(p.price as any, p.id, ctx);
          const isDiscounted = effective.lt(new D(p.price as any));
          return (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col">
              <Link href={`/customer/products/${p.id}`} className="block">
                <div className="aspect-[4/3] relative bg-slate-100">
                  {cover ? (
                    <Image src={cover} alt={p.name} fill className="object-cover hover:scale-105 transition" sizes="(max-width: 768px) 100vw, 33vw" unoptimized />
                  ) : null}
                  <span className={`absolute top-2 right-2 text-xs px-2 py-0.5 rounded ${available > 0 ? "bg-emerald-600 text-white" : "bg-red-600 text-white"}`}>
                    {available > 0 ? `Stok: ${available}` : "Tükendi"}
                  </span>
                </div>
              </Link>
              <div className="p-4 flex-1 flex flex-col">
                <div className="text-xs text-slate-500">{CATEGORY_LABEL[p.category] ?? p.category}</div>
                <Link href={`/customer/products/${p.id}`} className="font-semibold hover:underline mt-1">{p.name}</Link>
                <div className="text-xs text-slate-500 mt-1">{p.collection ?? ""}</div>
                <div className="mt-2 text-sm">
                  {isDiscounted ? (
                    <div className="flex items-baseline gap-2">
                      <span className="text-slate-400 line-through">{formatTRY(p.price as any)}</span>
                      <span className="font-semibold text-emerald-700">{formatTRY(effective)}</span>
                    </div>
                  ) : (
                    <span className="font-semibold">{formatTRY(effective)}</span>
                  )}
                  <span className="text-xs text-slate-500 ml-1">/ {p.unit} · KDV {formatPercent(p.vatRate as any)}</span>
                </div>
                <div className="mt-auto pt-3">
                  <AddToCartForm productId={p.id} maxQty={available} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
