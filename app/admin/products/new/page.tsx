import ProductForm from "../ProductForm";
import { createProduct } from "@/lib/products/actions";

export default function NewProductPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Yeni Ürün</h1>
      <ProductForm action={createProduct} submitLabel="Oluştur" />
    </div>
  );
}
