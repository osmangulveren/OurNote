import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/session";

export default async function AdminWarehousesPage() {
  await requirePermission("warehouses.manage");
  const warehouses = await prisma.warehouse.findMany({
    include: {
      stocks: { include: { product: true }, orderBy: { product: { name: "asc" } } },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Depolar</h1>
        <p className="text-sm text-slate-500">Sipariş anında stok önce default depodan, sonra en dolu olandan ayrılır.</p>
      </div>

      {warehouses.map((w) => (
        <section key={w.id} className="bg-white border border-slate-200 rounded-2xl p-5">
          <header className="flex items-baseline justify-between mb-3">
            <div>
              <h2 className="font-semibold">
                {w.name}
                {w.isDefault ? <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded">default</span> : null}
                {!w.isActive ? <span className="ml-2 text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded">pasif</span> : null}
              </h2>
              <p className="text-xs text-slate-500">Kod: <span className="font-mono">{w.code}</span>{w.address ? ` · ${w.address}` : ""}</p>
            </div>
          </header>
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500"><tr>
              <th className="py-1">SKU</th><th>Ürün</th>
              <th className="text-right">Stok</th><th className="text-right">Rezerve</th><th className="text-right">Kullanılabilir</th>
            </tr></thead>
            <tbody>
              {w.stocks.length === 0 ? (
                <tr><td colSpan={5} className="py-2 text-slate-400">Bu depoda stok kaydı yok.</td></tr>
              ) : w.stocks.map((s) => (
                <tr key={s.id} className="border-t border-slate-100">
                  <td className="py-1.5 font-mono text-xs">{s.product.sku}</td>
                  <td>{s.product.name}</td>
                  <td className="text-right">{s.stockQuantity}</td>
                  <td className="text-right">{s.reservedQuantity}</td>
                  <td className="text-right">{Math.max(0, s.stockQuantity - s.reservedQuantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  );
}
