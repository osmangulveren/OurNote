import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatTRY, formatPercent } from "@/lib/money";

export default async function AdminProductsPage() {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Ürünler</h1>
        <Link
          href="/admin/products/new"
          className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800"
        >
          + Yeni Ürün
        </Link>
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-2">SKU</th>
              <th className="px-4 py-2">Ürün</th>
              <th className="px-4 py-2">Birim</th>
              <th className="px-4 py-2 text-right">Fiyat</th>
              <th className="px-4 py-2 text-right">KDV</th>
              <th className="px-4 py-2 text-right">Stok</th>
              <th className="px-4 py-2 text-right">Rez.</th>
              <th className="px-4 py-2">Durum</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td className="px-4 py-4 text-slate-500" colSpan={9}>Henüz ürün yok.</td></tr>
            ) : products.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-2 font-mono text-xs">{p.sku}</td>
                <td className="px-4 py-2">{p.name}</td>
                <td className="px-4 py-2">{p.unit}</td>
                <td className="px-4 py-2 text-right">{formatTRY(p.price as any)}</td>
                <td className="px-4 py-2 text-right">{formatPercent(p.vatRate as any)}</td>
                <td className="px-4 py-2 text-right">{p.stockQuantity}</td>
                <td className="px-4 py-2 text-right">{p.reservedQuantity}</td>
                <td className="px-4 py-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${p.isActive ? "bg-emerald-100 text-emerald-700" : "bg-slate-200 text-slate-600"}`}>
                    {p.isActive ? "Aktif" : "Pasif"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/products/${p.id}`} className="text-slate-700 hover:underline text-xs">Düzenle</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
