import { config } from "@/lib/config";
import { cbm, money } from "@/lib/format";

type Totals = { subtotal: number; freight: number; vatRate: number; vatAmount: number; vatNote: string; total: number; volume: number };

export default function TotalsBox({ totals, children }: { totals: Totals; children?: React.ReactNode }) {
  const fill = Math.min(100, (totals.volume / config.truckCapacityCbm) * 100);
  return (
    <div className="card space-y-3 p-5 text-sm">
      <div className="flex justify-between"><span>Subtotal</span><span>{money(totals.subtotal)}</span></div>
      <div className="flex justify-between">
        <span>Delivery to your store</span>
        <span>{totals.freight > 0 ? money(totals.freight) : <span className="font-semibold text-emerald-700">Included</span>}</span>
      </div>
      <div className="flex justify-between"><span>VAT {totals.vatRate}%</span><span>{money(totals.vatAmount)}</span></div>
      {totals.vatNote && <p className="rounded bg-slate-50 p-2 text-xs text-slate-500">{totals.vatNote}</p>}
      <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold">
        <span>Total</span><span className="text-brand-700">{money(totals.total)}</span>
      </div>
      {totals.volume > 0 && (
        <div className="pt-1">
          <div className="mb-1 flex justify-between text-xs text-slate-500">
            <span>Truck space used</span><span>{cbm(totals.volume)} · {fill.toFixed(0)}% of a trailer</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full bg-accent-500" style={{ width: `${Math.max(2, fill)}%` }} /></div>
        </div>
      )}
      {children}
    </div>
  );
}
