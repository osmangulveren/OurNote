import Link from "next/link";
import { notFound } from "next/navigation";
import ProductForm from "../ProductForm";
import ImageManager from "../ImageManager";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/lib/products/actions";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({
    where: { id: params.id },
    include: { images: { orderBy: { sortOrder: "asc" } } },
  });
  if (!product) notFound();

  const action = updateProduct.bind(null, product.id);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{product.name}</h1>
          <p className="text-sm text-slate-500">SKU {product.sku} · Rezerve: {product.reservedQuantity}</p>
        </div>
        <Link href="/admin/products" className="text-sm text-slate-600 hover:underline">← Tüm ürünler</Link>
      </div>

      <section className="space-y-3">
        <h2 className="font-semibold">Görseller</h2>
        <ImageManager productId={product.id} images={product.images} />
      </section>

      <section className="space-y-3">
        <h2 className="font-semibold">Ürün Bilgisi</h2>
        <ProductForm
          action={action}
          defaults={{
            sku: product.sku,
            name: product.name,
            description: product.description ?? "",
            unit: product.unit,
            price: product.price.toString(),
            vatRate: product.vatRate.toString(),
            stockQuantity: product.stockQuantity,
            isActive: product.isActive,
            category: product.category,
            collection: product.collection ?? "",
            designer: product.designer ?? "",
            modelInfo: product.modelInfo ?? "",
            widthCm: product.widthCm ?? "",
            depthCm: product.depthCm ?? "",
            heightCm: product.heightCm ?? "",
            seatWidthCm: product.seatWidthCm ?? "",
            seatDepthCm: product.seatDepthCm ?? "",
            seatHeightCm: product.seatHeightCm ?? "",
            seatCount: product.seatCount ?? "",
            weightKg: product.weightKg ? product.weightKg.toString() : "",
            fabricType: product.fabricType ?? "",
            fabricColor: product.fabricColor ?? "",
            fabricColorHex: product.fabricColorHex ?? "",
            frameType: product.frameType ?? "",
            foamDensityKgM3: product.foamDensityKgM3 ?? "",
            durabilityMartindale: product.durabilityMartindale ?? "",
            warrantyMonths: product.warrantyMonths ?? "",
            leadTimeDays: product.leadTimeDays ?? "",
            careInstructions: product.careInstructions ?? "",
            availableFabricColors: product.availableFabricColors,
            availableCompositions: product.availableCompositions,
            availableAddons: product.availableAddons,
          }}
          submitLabel="Güncelle"
        />
      </section>
    </div>
  );
}
