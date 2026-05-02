import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import PrintButton from "@/app/invoices/[id]/PrintButton";

export default async function DeliveryNotePage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const note = await prisma.deliveryNoteDraft.findUnique({
    where: { id: params.id },
    include: {
      order: {
        include: {
          items: true,
          user: { include: { customerProfile: true } },
          shipment: true,
        },
      },
    },
  });
  if (!note) notFound();

  const role = (session.user as any).role;
  const isAdminish = role && role !== "CUSTOMER";
  if (!isAdminish && note.order.userId !== session.user!.id) notFound();

  const company = {
    name: process.env.COMPANY_NAME ?? "Rosadore Home",
    tax: process.env.COMPANY_TAX_NUMBER ?? "—",
    address: process.env.COMPANY_ADDRESS ?? "—",
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="no-print flex items-center justify-between mb-4">
          <Link
            href={isAdminish ? `/admin/orders/${note.orderId}` : `/customer/orders/${note.orderId}`}
            className="text-sm text-slate-600 hover:underline"
          >
            ← Siparişe dön
          </Link>
          <PrintButton />
        </div>

        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-4 py-3 mb-4 text-sm no-print">
          ⚠️ Bu belge resmi e-İrsaliye değildir. MVP taslak çıktısıdır.
        </div>

        <article className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <header className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <h1 className="text-xl font-bold">SEVK İRSALİYESİ — TASLAK</h1>
              <p className="text-xs text-slate-500 mt-1">Resmi e-İrsaliye değildir.</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-mono">No: <strong>{note.noteNumber}</strong></p>
              <p>Tarih: {note.issueDate.toLocaleDateString("tr-TR")}</p>
              <p>Sipariş: {note.order.orderNumber}</p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-6 text-sm mb-4">
            <div>
              <h2 className="font-semibold text-slate-500 text-xs uppercase mb-1">Gönderen</h2>
              <p className="font-medium">{company.name}</p>
              <p>VKN: {company.tax}</p>
              <p className="text-slate-600">{company.address}</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-500 text-xs uppercase mb-1">Alıcı</h2>
              <p className="font-medium">{note.order.user.customerProfile?.companyName ?? note.order.user.name ?? "—"}</p>
              {note.order.user.customerProfile?.taxNumber && <p>VKN: {note.order.user.customerProfile.taxNumber}</p>}
              <p>{note.order.user.email}</p>
              {note.order.user.customerProfile?.address && <p className="text-slate-600">{note.order.user.customerProfile.address}</p>}
            </div>
          </div>

          {note.carrierPlate || note.carrierDriver ? (
            <div className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm mb-4 grid grid-cols-2 gap-2">
              {note.carrierPlate && <div><span className="text-slate-500">TIR Plakası:</span> <span className="font-mono">{note.carrierPlate}</span></div>}
              {note.carrierDriver && <div><span className="text-slate-500">Şoför:</span> {note.carrierDriver}</div>}
            </div>
          ) : null}

          <table className="w-full text-sm mb-4">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-2 py-2">SKU</th>
                <th className="px-2 py-2">Ürün</th>
                <th className="px-2 py-2 text-right">Miktar</th>
                <th className="px-2 py-2">Birim</th>
              </tr>
            </thead>
            <tbody>
              {note.order.items.map((it) => (
                <tr key={it.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-mono text-xs">{it.sku}</td>
                  <td className="px-2 py-2">{it.productName}</td>
                  <td className="px-2 py-2 text-right">{it.quantity}</td>
                  <td className="px-2 py-2">{it.unit}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="text-sm">
              <tr><td colSpan={2} className="pt-3 text-right text-slate-500">Toplam kalem</td><td className="pt-3 text-right" colSpan={2}>{note.totalLineCount}</td></tr>
              <tr><td colSpan={2} className="text-right text-slate-500">Toplam adet</td><td className="text-right" colSpan={2}>{note.totalQuantity}</td></tr>
            </tfoot>
          </table>

          <div className="grid grid-cols-2 gap-6 mt-12 text-sm">
            <div>
              <p className="text-slate-500 mb-12">Teslim Eden</p>
              <p className="border-t border-slate-300 pt-1 text-xs">İmza / Kaşe</p>
            </div>
            <div>
              <p className="text-slate-500 mb-12">Teslim Alan</p>
              <p className="border-t border-slate-300 pt-1 text-xs">İmza / Kaşe</p>
            </div>
          </div>

          <footer className="mt-10 text-xs text-slate-400 border-t pt-3">
            Bu belge resmi e-İrsaliye değildir. MVP taslak çıktısıdır.
          </footer>
        </article>
      </div>
    </div>
  );
}
