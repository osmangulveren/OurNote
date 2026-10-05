import { db } from "@/lib/db";
import ProductForm from "../ProductForm";

export const metadata = { title: "New product" };

export default async function NewProduct() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" } });
  return (
    <div className="space-y-6">
      <h1 className="h1">New product</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
