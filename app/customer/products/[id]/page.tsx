import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { formatTRY, formatPercent, D } from "@/lib/money";
import { effectiveUnitPrice, loadCustomerPricingContext } from "@/lib/pricing";
import Gallery from "./Gallery";
import AddToCartForm from "../AddToCartForm";

const CATEGORY_LABEL: Record<string, string> = { KOLTUK: "Tekli Koltuk", KANEPE: "Kanepe / Set", SOMINE: "Şömine" };
const FABRIC_LABEL: Record<string, string> = { BOUCLE: "Bouclé", KADIFE: "Kadife", CHENILLE: "Chenille", SUNI_DERI: "Suni Deri", KETEN: "Keten", DIGER: "Diğer", YOK: "Yok" };
const FRAME_LABEL: Record<string, string> = { KAYIN_MASIF: "Kayın Masif", MDF: "MDF", METAL: "Metal", KARMA: "Karma", YOK: "Yok" };

export default async function CustomerProductDetailPage({ params }: { params: { id: string } }) {
  const session = await requireCustomer();
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product || !product.isActive) notFound();

  const ctx = await loadCustomerPricingContext(prisma, session.user!.id);
  const effective = effectiveUnitPrice(product.price as any, product.id, ctx);
  const isDiscounted = effective.lt(new D(product.price as any));
  const available = Math.max(0, product.stockQuantity - product.reservedQuantity);

  const dim = (a?: number | null, b?: number | null, c?: number | null) =>
    [a, b, c].filter((v) => v !== null && v !== undefined).join(" × ") + " cm";

  const specs: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Kategori", value: CATEGORY_LABEL[product.category] ?? product.category },
    { label: "Koleksiyon", value: product.collection },
    { label: "Tasarımcı", value: product.designer },
    { label: "Model", value: product.modelInfo },
    { label: "Genel ölçüler (G×D×Y)", value: product.widthCm ? dim(product.widthCm, product.depthCm, product.heightCm) : null },
    { label: "Oturma alanı (G×D×Y)", value: product.seatWidthCm ? dim(product.seatWidthCm, product.seatDepthCm, product.seatHeightCm) : null },
    { label: "Kişi sayısı", value: product.seatCount ? `${product.seatCount} kişilik` : null },
    { label: "Ağırlık", value: product.weightKg ? `${product.weightKg.toString()} kg` : null },
    { label: "Kumaş türü", value: product.fabricType ? FABRIC_LABEL[product.fabricType] : null },
    { label: "Kumaş rengi", value: product.fabricColor },
    { label: "İskelet", value: product.frameType ? FRAME_LABEL[product.frameType] : null },
    { label: "Sünger yoğunluğu", value: product.foamDensityKgM3 ? `${product.foamDensityKgM3} kg/m³` : null },
    { label: "Dayanıklılık", value: product.durabilityMartindale ? `${product.durabilityMartindale.toLocaleString("tr-TR")} Martindale` : null },
    { label: "Garanti", value: product.warrantyMonths ? `${product.warrantyMonths} ay` : null },
    { label: "Üretim süresi", value: product.leadTimeDays ? `${product.leadTimeDays} gün` : null },
  ];
  const visible = specs.filter((s) => s.value);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/customer/products" className="text-sm text-slate-600 hover:underline">← Katalog</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Gallery images={product.images.map((i) => ({ url: i.url, alt: i.alt ?? product.name }))} />

        <div className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">{CATEGORY_LABEL[product.category]} · {product.collection ?? ""}</p>
            <h1 className="text-2xl font-semibold mt-1">{product.name}</h1>
            <p className="text-xs text-slate-400 font-mono mt-1">SKU: {product.sku}</p>
          </div>

          {product.description ? <p className="text-sm text-slate-700">{product.description}</p> : null}

          <div className="border-y border-slate-200 py-4">
            {isDiscounted ? (
              <div className="flex items-baseline gap-3">
                <span className="text-slate-400 line-through">{formatTRY(product.price as any)}</span>
                <span className="text-2xl font-semibold text-emerald-700">{formatTRY(effective)}</span>
                <span className="text-xs text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">size özel</span>
              </div>
            ) : (
              <span className="text-2xl font-semibold">{formatTRY(effective)}</span>
            )}
            <p className="text-xs text-slate-500 mt-1">/ {product.unit} · KDV {formatPercent(product.vatRate as any)}</p>
            <p className="text-xs text-slate-500 mt-2">
              {available > 0 ? `Stokta ${available} ${product.unit} mevcut` : "Stok tükendi"}
              {product.leadTimeDays ? ` · ortalama ${product.leadTimeDays} gün üretim süresi` : ""}
            </p>
          </div>

          {product.fabricColorHex ? (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-600">Renk örneği:</span>
              <span className="inline-block w-6 h-6 rounded border border-slate-300" style={{ backgroundColor: product.fabricColorHex }} />
              <span className="text-slate-700">{product.fabricColor}</span>
            </div>
          ) : null}

          <AddToCartForm productId={product.id} maxQty={available} />
        </div>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="font-semibold mb-3">Teknik Özellikler</h2>
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 text-sm">
          {visible.map((s) => (
            <div key={s.label} className="flex justify-between border-b border-slate-100 py-1.5">
              <dt className="text-slate-500">{s.label}</dt>
              <dd className="text-slate-900 text-right">{s.value}</dd>
            </div>
          ))}
        </dl>
        {product.careInstructions ? (
          <div className="mt-4 text-sm">
            <h3 className="font-semibold mb-1">Bakım talimatları</h3>
            <p className="text-slate-700">{product.careInstructions}</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
