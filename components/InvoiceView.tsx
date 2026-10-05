import { config, countryName } from "@/lib/config";
import { date, money } from "@/lib/format";
import PrintButton from "./PrintButton";

type Order = {
  number: string; createdAt: Date; paymentStatus: string; paidAt: Date | null; subtotal: number; freight: number;
  vatRate: number; vatAmount: number; vatNote: string; total: number;
  deliveryName: string; deliveryAddress: string; deliveryCity: string; deliveryPostal: string; deliveryCountry: string;
  company: { name: string; vatNumber: string | null; address: string; postalCode: string; city: string; country: string };
  items: { id: string; sku: string; name: string; color: string; quantity: number; unitPrice: number; lineTotal: number }[];
};

export default function InvoiceView({ order }: { order: Order }) {
  const paid = order.paymentStatus === "PAID";
  const c = order.company;
  return (
    <div className="mx-auto max-w-3xl bg-white p-10 print:p-0">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <div className="text-2xl font-bold text-brand-700">{config.brandName}</div>
          <div className="text-sm text-slate-600">{config.company.legalName}<br />{config.company.address}<br />VAT {config.company.vat}<br />{config.company.email}</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold">{paid ? "INVOICE" : "PROFORMA INVOICE"}</div>
          <div className="text-sm">No. <b>{order.number}</b><br />Date {date(order.createdAt)}{paid && <><br />Paid {date(order.paidAt)}</>}</div>
          <div className="mt-3"><PrintButton /></div>
        </div>
      </div>
      <div className="mb-8 grid grid-cols-2 gap-6 text-sm">
        <div><div className="label">Bill to</div><b>{c.name}</b><br />{c.address}<br />{c.postalCode} {c.city}, {countryName(c.country)}<br />{c.vatNumber && <>VAT {c.vatNumber}</>}</div>
        <div><div className="label">Deliver to</div><b>{order.deliveryName}</b><br />{order.deliveryAddress}<br />{order.deliveryPostal} {order.deliveryCity}, {countryName(order.deliveryCountry)}</div>
      </div>
      <table className="table mb-6">
        <thead><tr><th>SKU</th><th>Description</th><th className="text-right">Qty</th><th className="text-right">Unit (EUR)</th><th className="text-right">Amount</th></tr></thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id}><td className="font-mono text-xs">{i.sku}</td><td>{i.name}{i.color && ` – ${i.color}`}</td><td className="text-right">{i.quantity}</td><td className="text-right">{money(i.unitPrice)}</td><td className="text-right">{money(i.lineTotal)}</td></tr>
          ))}
        </tbody>
      </table>
      <div className="ml-auto w-72 space-y-1 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>{money(order.subtotal)}</span></div>
        <div className="flex justify-between"><span>Delivery</span><span>{order.freight > 0 ? money(order.freight) : "Included"}</span></div>
        <div className="flex justify-between"><span>VAT {order.vatRate}%</span><span>{money(order.vatAmount)}</span></div>
        <div className="flex justify-between border-t pt-2 text-base font-bold"><span>Total EUR</span><span>{money(order.total)}</span></div>
      </div>
      {order.vatNote && <p className="mt-6 text-xs text-slate-600">{order.vatNote}</p>}
      {!paid && (
        <p className="mt-6 rounded bg-slate-50 p-3 text-sm">
          Please transfer {money(order.total)} to {config.company.legalName}, {config.company.bank}, IBAN <b className="font-mono">{config.company.iban}</b>, reference <b>{order.number}</b>.
        </p>
      )}
    </div>
  );
}
