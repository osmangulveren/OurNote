import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/auth/session";
import { formatTRY, formatPercent } from "@/lib/money";
import MarkReadyButton from "./MarkReadyButton";
import PrintButton from "./PrintButton";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const session = await requireSession();
  const invoice = await prisma.invoiceDraft.findUnique({
    where: { id: params.id },
    include: {
      customer: { include: { customerProfile: true } },
      order: { include: { items: true } },
    },
  });
  if (!invoice) notFound();

  const role = (session.user as any).role;
  const isAdminish = role && role !== "CUSTOMER";
  if (!isAdminish && invoice.customerId !== session.user!.id) {
    notFound();
  }

  const company = {
    name: process.env.COMPANY_NAME ?? "Örnek Tedarik A.Ş.",
    tax: process.env.COMPANY_TAX_NUMBER ?? "1234567890",
    address: process.env.COMPANY_ADDRESS ?? "—",
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white p-6">
      <div className="max-w-4xl mx-auto">
        <div className="no-print flex items-center justify-between mb-4">
          <Link
            href={isAdminish ? `/admin/orders/${invoice.orderId}` : `/customer/orders/${invoice.orderId}`}
            className="text-sm text-slate-600 hover:underline"
          >
            ← Siparişe dön
          </Link>
          <div className="flex items-center gap-2">
            {isAdminish && invoice.status === "DRAFT" ? (
              <MarkReadyButton invoiceId={invoice.id} />
            ) : null}
            <PrintButton />
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-300 text-amber-900 rounded-lg px-4 py-3 mb-4 text-sm no-print">
          ⚠️ Bu belge resmi e-Fatura/e-Arşiv değildir. MVP taslak/proforma çıktısıdır.
        </div>

        <article className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <header className="flex justify-between items-start border-b pb-4 mb-4">
            <div>
              <h1 className="text-xl font-bold">TASLAK / PROFORMA FATURA</h1>
              <p className="text-xs text-slate-500 mt-1">Resmi e-Fatura/e-Arşiv değildir.</p>
            </div>
            <div className="text-right text-sm">
              <p className="font-mono">No: <strong>{invoice.invoiceNumber}</strong></p>
              <p>Tarih: {invoice.issueDate.toLocaleDateString("tr-TR")}</p>
              <p>Durum: {invoice.status}</p>
            </div>
          </header>

          <div className="grid grid-cols-2 gap-6 text-sm mb-6">
            <div>
              <h2 className="font-semibold text-slate-500 text-xs uppercase mb-1">Satıcı</h2>
              <p className="font-medium">{company.name}</p>
              <p>VKN: {company.tax}</p>
              <p className="text-slate-600">{company.address}</p>
            </div>
            <div>
              <h2 className="font-semibold text-slate-500 text-xs uppercase mb-1">Alıcı</h2>
              <p className="font-medium">{invoice.customer.customerProfile?.companyName ?? invoice.customer.name ?? "—"}</p>
              {invoice.customer.customerProfile?.taxNumber && <p>VKN: {invoice.customer.customerProfile.taxNumber}</p>}
              <p>{invoice.customer.email}</p>
              {invoice.customer.customerProfile?.address && <p className="text-slate-600">{invoice.customer.customerProfile.address}</p>}
            </div>
          </div>

          <p className="text-sm mb-2">Sipariş No: <span className="font-mono">{invoice.order.orderNumber}</span></p>

          <table className="w-full text-sm mb-6">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="px-2 py-2">SKU</th>
                <th className="px-2 py-2">Ürün</th>
                <th className="px-2 py-2 text-right">Miktar</th>
                <th className="px-2 py-2 text-right">Birim Fiyat</th>
                <th className="px-2 py-2 text-right">KDV</th>
                <th className="px-2 py-2 text-right">Toplam</th>
              </tr>
            </thead>
            <tbody>
              {invoice.order.items.map((it) => (
                <tr key={it.id} className="border-t border-slate-100">
                  <td className="px-2 py-2 font-mono text-xs">{it.sku}</td>
                  <td className="px-2 py-2">{it.productName}</td>
                  <td className="px-2 py-2 text-right">{it.quantity} {it.unit}</td>
                  <td className="px-2 py-2 text-right">{formatTRY(it.unitPrice as any)}</td>
                  <td className="px-2 py-2 text-right">{formatPercent(it.vatRate as any)}</td>
                  <td className="px-2 py-2 text-right">{formatTRY(it.lineTotal as any)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex justify-end">
            <table className="text-sm">
              <tbody>
                <tr><td className="pr-6 text-slate-500">Ara Toplam</td><td className="text-right">{formatTRY(invoice.subtotal as any)}</td></tr>
                <tr><td className="pr-6 text-slate-500">KDV Toplamı</td><td className="text-right">{formatTRY(invoice.vatTotal as any)}</td></tr>
                <tr><td className="pr-6 font-semibold pt-1">Genel Toplam</td><td className="text-right font-semibold pt-1">{formatTRY(invoice.grandTotal as any)}</td></tr>
              </tbody>
            </table>
          </div>

          <footer className="mt-10 text-xs text-slate-400 border-t pt-3">
            Bu belge resmi e-Fatura/e-Arşiv değildir. MVP taslak/proforma çıktısıdır. Resmi süreç için e-Fatura entegratörü kullanılmalıdır.
          </footer>
        </article>
      </div>
    </div>
  );
}

