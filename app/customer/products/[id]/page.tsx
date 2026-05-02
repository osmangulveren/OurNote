import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { D } from "@/lib/money";
import { effectiveUnitPrice, loadCustomerPricingContext } from "@/lib/pricing";
import Configurator from "./Configurator";

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
  const baseEffective = effectiveUnitPrice(product.price as any, product.id, ctx);
  const isDiscounted = baseEffective.lt(new D(product.price as any));
  const available = Math.max(0, product.stockQuantity - product.reservedQuantity);

  const dim = (a?: number | null, b?: number | null, c?: number | null) =>
    [a, b, c].filter((v) => v !== null && v !== undefined).join(" × ") + " cm";

  const specs: Array<{ label: string; value: string | null | undefined }> = [
    { label: "Kategori", value: CATEGORY_LABEL[product.category] ?? product.category },
    { label: "Koleksiyon", value: product.collection },
    { label: "Tasarımcı", value: product.designer },
    { label: "Model", value: product.modelInfo },
    { label: "Genel ölçüler", value: product.widthCm ? dim(product.widthCm, product.depthCm, product.heightCm) : null },
    { label: "Oturma alanı", value: product.seatWidthCm ? dim(product.seatWidthCm, product.seatDepthCm, product.seatHeightCm) : null },
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

  const images = product.images.map((i) => ({ url: i.url, alt: i.alt ?? product.name }));

  return (
    <div className="bg-white -mx-4 -my-6">
      <div className="bg-slate-50 border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between text-sm">
          <Link href="/customer/products" className="text-slate-600 hover:text-slate-900">← Katalog</Link>
          <span className="text-slate-400">{CATEGORY_LABEL[product.category]}</span>
        </div>
      </div>

      <section className="max-w-6xl mx-auto px-4 pt-12 pb-6 text-center">
        <p className="text-sm uppercase tracking-[0.2em] text-slate-500">{product.collection ?? "ROSADORE"}</p>
        <h1 className="text-4xl sm:text-5xl font-semibold tracking-tight mt-2">{product.name}</h1>
        {product.description ? (
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mt-4">{product.description}</p>
        ) : null}
      </section>

      <Configurator
        productId={product.id}
        productName={product.name}
        sku={product.sku}
        unit={product.unit}
        baseEffectivePrice={baseEffective.toFixed(2)}
        listPrice={isDiscounted ? new D(product.price as any).toFixed(2) : null}
        available={available}
        leadTimeDays={product.leadTimeDays}
        images={images}
        availableFabricColors={(product.availableFabricColors as any) ?? []}
        availableCompositions={(product.availableCompositions as any) ?? []}
        availableAddons={(product.availableAddons as any) ?? []}
      />

      <section className="bg-slate-50 border-t border-slate-100 py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="text-2xl font-semibold text-center mb-8">Teknik Özellikler</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 text-base">
            {visible.map((s) => (
              <div key={s.label} className="flex justify-between border-b border-slate-200 py-3">
                <dt className="text-slate-500">{s.label}</dt>
                <dd className="text-slate-900 text-right font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
          {product.careInstructions ? (
            <div className="mt-8 text-sm bg-white border border-slate-200 rounded-2xl p-5">
              <h3 className="font-semibold mb-1">Bakım talimatları</h3>
              <p className="text-slate-700">{product.careInstructions}</p>
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
