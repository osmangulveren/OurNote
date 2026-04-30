import Link from "next/link";
import { buildAccountingReport, getDefaultWeeklyRange } from "@/lib/accounting/report";
import { formatTRY } from "@/lib/money";

function parseDate(s?: string, fallback?: Date) {
  if (!s) return fallback ?? new Date();
  const d = new Date(s);
  if (isNaN(d.getTime())) return fallback ?? new Date();
  return d;
}

export default async function AccountingPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const def = getDefaultWeeklyRange();
  const start = parseDate(searchParams.from, def.start);
  const end = parseDate(searchParams.to, def.end);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  const report = await buildAccountingReport(start, end);
  const fmt = (d: Date) => d.toISOString().slice(0, 10);

  const csvHref = `/admin/accounting/csv?from=${fmt(start)}&to=${fmt(end)}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ön Muhasebe Raporu</h1>
          <p className="text-sm text-slate-500">Onaylanmış ve sevk edilmiş siparişler dahil edilir.</p>
        </div>
        <form className="flex items-end gap-2 text-sm">
          <div>
            <label className="block text-xs text-slate-500">Başlangıç</label>
            <input type="date" name="from" defaultValue={fmt(start)} className="border border-slate-300 rounded-lg px-2 py-1.5" />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Bitiş</label>
            <input type="date" name="to" defaultValue={fmt(end)} className="border border-slate-300 rounded-lg px-2 py-1.5" />
          </div>
          <button className="bg-slate-900 text-white rounded-lg px-3 py-1.5">Filtrele</button>
          <Link
            href={csvHref}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-3 py-1.5"
          >
            CSV indir
          </Link>
        </form>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Sipariş Sayısı" value={report.totalOrders.toString()} />
        <Stat label="Toplam Satış" value={formatTRY(report.totalSales)} />
        <Stat label="KDV Toplamı" value={formatTRY(report.totalVat)} />
        <Stat label="Genel Toplam" value={formatTRY(report.totalGrand)} />
      </div>

      <Section title="Müşteri Bazlı Satışlar">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500"><tr>
            <th className="py-2">Müşteri</th><th>Firma</th><th className="text-right">Sipariş</th>
            <th className="text-right">Subtotal</th><th className="text-right">KDV</th><th className="text-right">Toplam</th>
          </tr></thead>
          <tbody>
            {report.customers.length === 0 ? (
              <tr><td colSpan={6} className="py-3 text-slate-500">Veri yok.</td></tr>
            ) : report.customers.map((c) => (
              <tr key={c.customerId} className="border-t border-slate-100">
                <td className="py-2">{c.customerEmail}</td>
                <td>{c.companyName ?? "—"}</td>
                <td className="text-right">{c.orderCount}</td>
                <td className="text-right">{formatTRY(c.subtotal)}</td>
                <td className="text-right">{formatTRY(c.vatTotal)}</td>
                <td className="text-right">{formatTRY(c.grandTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Ürün Bazlı Satışlar">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500"><tr>
            <th className="py-2">SKU</th><th>Ürün</th><th className="text-right">Miktar</th>
            <th className="text-right">Subtotal</th><th className="text-right">KDV</th><th className="text-right">Toplam</th>
          </tr></thead>
          <tbody>
            {report.products.length === 0 ? (
              <tr><td colSpan={6} className="py-3 text-slate-500">Veri yok.</td></tr>
            ) : report.products.map((p) => (
              <tr key={p.productId} className="border-t border-slate-100">
                <td className="py-2 font-mono text-xs">{p.sku}</td>
                <td>{p.productName}</td>
                <td className="text-right">{p.quantity}</td>
                <td className="text-right">{formatTRY(p.subtotal)}</td>
                <td className="text-right">{formatTRY(p.vatTotal)}</td>
                <td className="text-right">{formatTRY(p.grandTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <Section title="Fatura Taslakları">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500"><tr>
            <th className="py-2">No</th><th>Sipariş</th><th>Müşteri</th><th>Tarih</th>
            <th className="text-right">Toplam</th><th>Durum</th>
          </tr></thead>
          <tbody>
            {report.invoices.length === 0 ? (
              <tr><td colSpan={6} className="py-3 text-slate-500">Veri yok.</td></tr>
            ) : report.invoices.map((i) => (
              <tr key={i.id} className="border-t border-slate-100">
                <td className="py-2"><Link href={`/invoices/${i.id}`} className="hover:underline">{i.invoiceNumber}</Link></td>
                <td>{i.orderNumber}</td>
                <td>{i.customerEmail}</td>
                <td>{i.issueDate.slice(0, 10)}</td>
                <td className="text-right">{formatTRY(i.grandTotal)}</td>
                <td><span className="inline-block text-xs bg-slate-100 px-2 py-0.5 rounded">{i.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <p className="text-xs text-slate-400">
        Not: Haftalık otomatik gönderim simülasyonu için <code>npm run report:weekly</code> komutunu kullanabilirsiniz.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-5 overflow-x-auto">
      <h2 className="font-semibold mb-3">{title}</h2>
      {children}
    </section>
  );
}
