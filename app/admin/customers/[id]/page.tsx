import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatTRY } from "@/lib/money";
import { effectiveUnitPrice } from "@/lib/pricing";
import ProfileForm from "./ProfileForm";
import PriceOverridesTable from "./PriceOverridesTable";

export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const customer = await prisma.user.findUnique({
    where: { id: params.id },
    include: {
      customerProfile: true,
      orders: { select: { id: true, orderNumber: true, grandTotal: true, status: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 10 },
      customPrices: { include: { product: true } },
    },
  });
  if (!customer || customer.role !== "CUSTOMER") notFound();

  const products = await prisma.product.findMany({
    where: { isActive: true },
    orderBy: [{ category: "asc" }, { name: "asc" }],
    select: { id: true, sku: true, name: true, price: true, category: true },
  });

  const overrideMap: Record<string, string> = {};
  for (const o of customer.customPrices) overrideMap[o.productId] = o.price.toString();

  const pricingCtx = {
    discountPercentage: customer.customerProfile?.discountPercentage,
    productOverrides: Object.fromEntries(customer.customPrices.map((o) => [o.productId, o.price as any])),
  };

  const previewRows = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    listPrice: p.price.toString(),
    overridePrice: overrideMap[p.id] ?? "",
    effective: effectiveUnitPrice(p.price as any, p.id, pricingCtx).toFixed(2),
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{customer.name ?? customer.email}</h1>
          <p className="text-sm text-slate-500">{customer.email}</p>
        </div>
        <Link href="/admin/customers" className="text-sm text-slate-600 hover:underline">← Tüm müşteriler</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold">Profil & İskonto</h2>
          <ProfileForm
            userId={customer.id}
            defaults={{
              companyName: customer.customerProfile?.companyName ?? "",
              taxNumber: customer.customerProfile?.taxNumber ?? "",
              phone: customer.customerProfile?.phone ?? "",
              address: customer.customerProfile?.address ?? "",
              discountPercentage: customer.customerProfile?.discountPercentage?.toString() ?? "0",
            }}
          />
        </section>

        <section className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Son Siparişler</h2>
          </div>
          {customer.orders.length === 0 ? (
            <p className="text-sm text-slate-500">Henüz sipariş yok.</p>
          ) : (
            <table className="w-full text-sm">
              <thead className="text-left text-slate-500"><tr>
                <th className="py-2">Sipariş</th><th>Tarih</th><th>Durum</th><th className="text-right">Tutar</th>
              </tr></thead>
              <tbody>
                {customer.orders.map((o) => (
                  <tr key={o.id} className="border-t border-slate-100">
                    <td className="py-2"><Link href={`/admin/orders/${o.id}`} className="hover:underline">{o.orderNumber}</Link></td>
                    <td>{o.createdAt.toLocaleString("tr-TR")}</td>
                    <td><span className="inline-block text-xs bg-slate-100 px-2 py-0.5 rounded">{o.status}</span></td>
                    <td className="text-right">{formatTRY(o.grandTotal as any)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <h2 className="font-semibold mb-1">Ürün-bazlı Özel Fiyat</h2>
        <p className="text-xs text-slate-500 mb-4">
          Bir override girersen müşteri için yüzde iskonto uygulanmaz; o ürünün fiyatı doğrudan girdiğin değer olur.
          Boş bırakırsan profil iskontosu geçerli olur.
        </p>
        <PriceOverridesTable customerId={customer.id} rows={previewRows} />
      </section>
    </div>
  );
}
