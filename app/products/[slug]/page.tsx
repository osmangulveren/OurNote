import Link from "next/link";
import { notFound } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import { canSeePrices, currentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { money, parseJson } from "@/lib/format";
import { tiersOf } from "@/lib/pricing";
import AddToCart from "./AddToCart";

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
  const images = parseJson<string[]>(product.images, []);
  const colors = parseJson<string[]>(product.colors, []);
  const specs = parseJson<{ label: string; value: string }[]>(product.specs, []);
  const tiers = tiersOf(product);

  const facts = [
    ["SKU", product.sku],
    ["Dimensions", product.dimensions],
    ["Material", product.material],
    ["Minimum order", `${product.moq} ${product.unit}`],
    ["Packages per unit", product.unitsPerCarton > 1 ? String(product.unitsPerCarton) : "1"],
    ["Packed volume", product.volumeM3 ? `${product.volumeM3} m³ / ${product.unit}` : ""],
    ["Packed weight", product.weightKg ? `${product.weightKg} kg / ${product.unit}` : ""],
    ["Lead time", `${product.leadTimeDays} days + transport`],
  ].filter(([, v]) => v);

  return (
    <div className="container-page py-8">
      <nav className="muted mb-6">
        <Link href="/catalog" className="hover:text-slate-700">Catalog</Link> /{" "}
        <Link href={`/catalog?category=${product.category.slug}`} className="hover:text-slate-700">{product.category.name}</Link>
      </nav>
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="space-y-3">
          <div className="card aspect-[4/3] overflow-hidden">
            <ProductImage src={images[0]} name={product.name} category={product.category.slug} />
          </div>
          {images.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {images.slice(1, 6).map((src) => (
                <a key={src} href={src} target="_blank" className="card aspect-square overflow-hidden">
                  <ProductImage src={src} name={product.name} />
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div>
            <div className="text-sm text-slate-500">{product.category.name}</div>
            <h1 className="text-3xl font-bold tracking-tight">{product.name}</h1>
            <p className="mt-2 text-slate-600">{product.shortDescription}</p>
          </div>

          {showPrices ? (
            <div className="card p-5">
              <div className="label mb-2">Wholesale prices (EUR, excl. VAT)</div>
              <table className="table mb-5">
                <thead><tr><th>Quantity</th><th className="text-right">Price / {product.unit}</th></tr></thead>
                <tbody>
                  {tiers.map((t, i) => (
                    <tr key={t.minQty}>
                      <td>{t.minQty}{tiers[i + 1] ? `–${tiers[i + 1].minQty - 1}` : "+"} {product.unit}</td>
                      <td className="text-right font-semibold">{money(t.price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {canOrder ? (
                <AddToCart productId={product.id} moq={product.moq} unit={product.unit} colors={colors} tiers={tiers} volumeM3={product.volumeM3} />
              ) : (
                <p className="muted">Ordering is available for buyer accounts.</p>
              )}
            </div>
          ) : (
            <div className="card p-5">
              <div className="font-semibold">Wholesale prices for trade customers</div>
              <p className="muted mt-1">
                {user ? "Your account is being reviewed; prices unlock after approval." : "Log in or open a trade account to see prices and order."}
              </p>
              {!user && (
                <div className="mt-4 flex gap-2">
                  <Link href={`/login?next=/products/${product.slug}`} className="btn-outline">Log in</Link>
                  <Link href="/register" className="btn-primary">Open a trade account</Link>
                </div>
              )}
            </div>
          )}

          <div className="card divide-y divide-slate-100">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 px-5 py-2.5 text-sm">
                <span className="text-slate-500">{k}</span><span className="text-right font-medium">{v}</span>
              </div>
            ))}
            {colors.length > 0 && (
              <div className="flex justify-between gap-4 px-5 py-2.5 text-sm">
                <span className="text-slate-500">Colours</span><span className="text-right font-medium">{colors.join(", ")}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        {product.description && (
          <section className="card p-6">
            <h2 className="mb-3 font-bold">Description</h2>
            <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{product.description}</p>
          </section>
        )}
        {specs.length > 0 && (
          <section className="card p-6">
            <h2 className="mb-3 font-bold">Specifications</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {specs.map((s) => (
                <div key={s.label} className="contents">
                  <dt className="text-slate-500">{s.label}</dt><dd className="font-medium">{s.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
      </div>
    </div>
  );
}
