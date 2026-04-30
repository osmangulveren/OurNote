import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { formatTRY } from "@/lib/money";

export default async function CustomerHome() {
  const session = await requireCustomer();
  const userId = session.user!.id;

  const [orders, profile] = await Promise.all([
    prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.customerProfile.findUnique({ where: { userId } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Hoş geldiniz{session.user?.name ? `, ${session.user.name}` : ""}</h1>
        {profile ? (
          <p className="text-sm text-slate-500">{profile.companyName}</p>
        ) : null}
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Link href="/customer/products" className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-400">
          <div className="text-sm text-slate-500">Ürün kataloğu</div>
          <div className="text-lg font-semibold">Stoklu ürünleri görüntüle</div>
        </Link>
        <Link href="/customer/cart" className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-400">
          <div className="text-sm text-slate-500">Sepetim</div>
          <div className="text-lg font-semibold">Siparişe çevir</div>
        </Link>
      </div>

      <section className="bg-white border border-slate-200 rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold">Son siparişlerim</h2>
          <Link href="/customer/orders" className="text-sm text-slate-600 hover:underline">Tümü →</Link>
        </div>
        {orders.length === 0 ? (
          <p className="text-sm text-slate-500">Henüz siparişiniz yok.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-slate-500"><tr>
              <th className="py-2">Sipariş</th><th>Tarih</th><th>Durum</th><th className="text-right">Tutar</th>
            </tr></thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-slate-100">
                  <td className="py-2"><Link href={`/customer/orders/${o.id}`} className="hover:underline">{o.orderNumber}</Link></td>
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
  );
}
