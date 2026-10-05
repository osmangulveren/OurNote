import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ProductForm from "../ProductForm";

export const metadata = { title: "Edit product" };

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    db.product.findUnique({ where: { id } }),
    db.category.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  if (!product) notFound();
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="h1">{product.name}</h1>
        <Link href={`/products/${product.slug}`} className="btn-outline" target="_blank">View in shop</Link>
      </div>
      <ProductForm product={product} categories={categories} />
    </div>
  );
}
