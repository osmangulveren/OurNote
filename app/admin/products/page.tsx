import Link from "next/link";
import ProductImage from "@/components/ProductImage";
import { toggleProduct } from "@/app/actions/admin";
import { db } from "@/lib/db";
import { money, parseJson } from "@/lib/format";

export const metadata = { title: "Products" };

export default async function AdminProducts({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const products = await db.product.findMany({
    where: q ? { OR: [{ name: { contains: q } }, { sku: { contains: q } }, { supplierName: { contains: q } }] } : {},
    include: { category: true },
    orderBy: [{ category: { sortOrder: "asc" } }, { name: "asc" }],
  });
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="h1">Products ({products.length})</h1>
        <div className="flex gap-2">
          <form><input name="q" defaultValue={q} placeholder="Search…" className="input w-48" /></form>
          <Link href="/admin/import" className="btn-outline">Import</Link>
          <Link href="/admin/products/new" className="btn-primary">New product</Link>
        </div>
      </div>
      <div className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th /><th>Product</th><th>Category</th><th className="text-right">Price</th><th className="text-right">Cost</th><th className="text-right">Margin</th><th>MOQ</th><th>Status</th><th /></tr></thead>
          <tbody>
            {products.map((p) => {
              const margin = p.supplierPrice > 0 ? ((p.price - p.supplierPrice) / p.price) * 100 : null;
              return (
                <tr key={p.id} className={p.active ? "" : "opacity-50"}>
                  <td><div className="h-10 w-14 overflow-hidden rounded"><ProductImage src={parseJson<string[]>(p.images, [])[0]} name="" category={p.category.slug} /></div></td>
                  <td><Link href={`/admin/products/${p.id}`} className="font-semibold hover:text-brand-600">{p.name}</Link><div className="font-mono text-xs text-slate-500">{p.sku}{p.supplierName && ` · ${p.supplierName}`}</div></td>
                  <td>{p.category.name}</td>
                  <td className="text-right font-semibold">{money(p.price)}</td>
                  <td className="text-right text-slate-500">{p.supplierPrice ? money(p.supplierPrice) : "—"}</td>
                  <td className="text-right">{margin === null ? "—" : `${margin.toFixed(0)}%`}</td>
                  <td>{p.moq} {p.unit}</td>
                  <td>{p.active ? <span className="badge bg-emerald-100 text-emerald-800">Active</span> : <span className="badge bg-slate-100 text-slate-600">Hidden</span>}</td>
                  <td className="whitespace-nowrap text-right">
                    <form action={toggleProduct} className="inline"><input type="hidden" name="id" value={p.id} /><button className="text-xs text-slate-500 hover:text-slate-900">{p.active ? "Hide" : "Show"}</button></form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
