import { notFound } from "next/navigation";
import ProductForm from "../ProductForm";
import { prisma } from "@/lib/prisma";
import { updateProduct } from "@/lib/products/actions";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const product = await prisma.product.findUnique({ where: { id: params.id } });
  if (!product) notFound();

  const action = updateProduct.bind(null, product.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Ürün Düzenle</h1>
        <p className="text-sm text-slate-500">Rezerve: {product.reservedQuantity} (sipariş bekleyen)</p>
      </div>
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
        }}
        submitLabel="Güncelle"
      />
    </div>
  );
}
