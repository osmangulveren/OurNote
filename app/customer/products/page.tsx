import { prisma } from "@/lib/prisma";
import { formatTRY, formatPercent } from "@/lib/money";
import AddToCartForm from "./AddToCartForm";

export default async function CustomerProductsPage() {
  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Ürün Kataloğu</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.length === 0 ? (
          <p className="text-slate-500">Şu an aktif ürün yok.</p>
        ) : products.map((p) => {
          const available = Math.max(0, p.stockQuantity - p.reservedQuantity);
          return (
            <div key={p.id} className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-mono text-xs text-slate-500">{p.sku}</p>
                  <h3 className="font-semibold">{p.name}</h3>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded ${available > 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {available > 0 ? `Stok: ${available} ${p.unit}` : "Tükendi"}
                </span>
              </div>
              {p.description && <p className="text-sm text-slate-600 mb-3">{p.description}</p>}
              <div className="text-sm text-slate-500 mb-3">
                {formatTRY(p.price as any)} / {p.unit} · KDV {formatPercent(p.vatRate as any)}
              </div>
              <div className="mt-auto">
                <AddToCartForm productId={p.id} maxQty={available} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
