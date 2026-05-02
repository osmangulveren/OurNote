import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";
import { formatTRY } from "@/lib/money";
import { PRODUCTION_STAGE_LABEL } from "@/lib/orders/productionStages";
import ViewModeToggle, { parseView } from "@/components/ViewModeToggle";

export default async function CustomerOrdersPage({ searchParams }: { searchParams: { view?: string } }) {
  const session = await requireCustomer();
  const view = parseView(searchParams.view);
  const orders = await prisma.order.findMany({
    where: { userId: session.user!.id },
    orderBy: { createdAt: "desc" },
    include: {
      invoice: true,
      items: { include: { product: { include: { images: { where: { isCover: true }, take: 1 } } } } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Siparişlerim</h1>
        <ViewModeToggle mode={view} baseUrl="/customer/orders" searchParams={{}} />
      </div>
      {orders.length === 0 ? (
        <p className="text-slate-500">Henüz siparişiniz yok.</p>
      ) : view === "list" ? (
        <ListView orders={orders} />
      ) : (
        <GridView orders={orders} />
      )}
    </div>
  );
}

function GridView({ orders }: { orders: any[] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {orders.map((o) => {
        const cover = o.items[0]?.product?.images?.[0]?.url;
        return (
          <Link key={o.id} href={`/customer/orders/${o.id}`} className="bg-white border border-slate-200 rounded-2xl overflow-hidden block hover:border-slate-400 transition">
            <div className="aspect-[16/9] relative bg-slate-100">
              {cover ? <Image src={cover} alt="" fill className="object-cover" sizes="(max-width: 768px) 100vw, 33vw" unoptimized /> : null}
              <span className="absolute top-2 right-2 text-xs bg-slate-900 text-white px-2 py-0.5 rounded">{o.status}</span>
            </div>
            <div className="p-4 space-y-1">
              <div className="flex justify-between items-baseline">
                <span className="font-mono text-sm">{o.orderNumber}</span>
                <span className="text-sm font-semibold">{formatTRY(o.grandTotal as any)}</span>
              </div>
              <p className="text-xs text-emerald-700">{PRODUCTION_STAGE_LABEL[o.productionStage as keyof typeof PRODUCTION_STAGE_LABEL]}</p>
              <p className="text-xs text-slate-500">{o.items.length} kalem · {o.createdAt.toLocaleDateString("tr-TR")}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

function ListView({ orders }: { orders: any[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-2">Sipariş No</th>
            <th className="px-4 py-2">Tarih</th>
            <th className="px-4 py-2">Durum / Aşama</th>
            <th className="px-4 py-2">Fatura</th>
            <th className="px-4 py-2 text-right">Tutar</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-slate-100">
              <td className="px-4 py-2"><Link href={`/customer/orders/${o.id}`} className="hover:underline font-medium font-mono text-xs">{o.orderNumber}</Link></td>
              <td className="px-4 py-2 text-slate-600 text-xs">{o.createdAt.toLocaleString("tr-TR")}</td>
              <td className="px-4 py-2 text-xs">
                <div><span className="bg-slate-100 px-2 py-0.5 rounded">{o.status}</span></div>
                <div className="text-slate-500 mt-0.5">{PRODUCTION_STAGE_LABEL[o.productionStage as keyof typeof PRODUCTION_STAGE_LABEL]}</div>
              </td>
              <td className="px-4 py-2 text-xs">
                {o.invoice ? <Link href={`/invoices/${o.invoice.id}`} className="text-emerald-700 hover:underline">{o.invoice.invoiceNumber}</Link> : "—"}
              </td>
              <td className="px-4 py-2 text-right font-medium">{formatTRY(o.grandTotal as any)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
