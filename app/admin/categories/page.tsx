import { deleteCategory, saveCategory } from "@/app/actions/admin";
import { db } from "@/lib/db";

export const metadata = { title: "Categories" };

export default async function CategoriesPage() {
  const categories = await db.category.findMany({ orderBy: { sortOrder: "asc" }, include: { _count: { select: { products: true } } } });
  return (
    <div className="space-y-6">
      <h1 className="h1">Categories</h1>
      <div className="card divide-y divide-slate-100">
        {categories.map((c) => (
          <div key={c.id} className="flex flex-wrap items-end gap-3 p-4">
            <form action={saveCategory} className="flex flex-1 flex-wrap items-end gap-3">
              <input type="hidden" name="id" value={c.id} />
              <div className="w-16"><label className="label">Order</label><input name="sortOrder" type="number" defaultValue={c.sortOrder} className="input" /></div>
              <div className="w-48"><label className="label">Name</label><input name="name" defaultValue={c.name} className="input" /></div>
              <div className="min-w-48 flex-1"><label className="label">Description</label><input name="description" defaultValue={c.description} className="input" /></div>
              <button className="btn-outline">Save</button>
            </form>
            <span className="muted w-24">{c._count.products} products</span>
            {c._count.products === 0 && (
              <form action={deleteCategory}><input type="hidden" name="id" value={c.id} /><button className="btn-danger">Delete</button></form>
            )}
          </div>
        ))}
      </div>
      <form action={saveCategory} className="card flex flex-wrap items-end gap-3 p-4">
        <div className="w-16"><label className="label">Order</label><input name="sortOrder" type="number" defaultValue={categories.length} className="input" /></div>
        <div className="w-48"><label className="label">New category</label><input name="name" required className="input" /></div>
        <div className="min-w-48 flex-1"><label className="label">Description</label><input name="description" className="input" /></div>
        <button className="btn-primary">Add</button>
      </form>
    </div>
  );
}
