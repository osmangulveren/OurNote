import { config } from "@/lib/config";
import { money } from "@/lib/format";

type Totals = { subtotal: number; freight: number; vatRate: number; vatAmount: number; vatNote: string; total: number; volume: number };

export default function TotalsBox({ totals, children, deposit }: { totals: Totals; children?: React.ReactNode; deposit?: number }) {
  const fill = Math.min(100, (totals.volume / config.truckCapacityCbm) * 100);
  return (
    <div className="panel space-y-3 p-6 text-sm">
      <div className="flex justify-between"><span className="text-ink-3">Products</span><span className="num">{money(totals.subtotal)}</span></div>
      <div className="flex justify-between">
        <span className="text-ink-3">Delivery & customs</span>
        <span className="num">{totals.freight > 0 ? money(totals.freight) : <span className="text-moss">Included</span>}</span>
      </div>
      <div className="flex justify-between"><span className="text-ink-3">VAT {totals.vatRate}%</span><span className="num">{money(totals.vatAmount)}</span></div>
      {totals.vatNote && <p className="rounded-xl bg-bone p-2.5 text-xs text-ink-3">{totals.vatNote}</p>}
      <div className="flex items-baseline justify-between border-t border-line pt-4">
        <span className="font-display text-2xl">Total</span>
        <span className="num font-display text-3xl">{money(totals.total)}</span>
      </div>
      {deposit !== undefined && deposit > 0 && (
        <div className="flex justify-between text-clay-2"><span>Due now ({config.depositPercent}% deposit)</span><span className="num">{money(deposit)}</span></div>
      )}
      {totals.volume > 0 && (
        <div className="pt-2">
          <div className="mb-1.5 flex justify-between font-mono text-[10px] uppercase tracking-wider text-stone">
            <span>{totals.volume.toFixed(2)} m³</span><span>{fill.toFixed(1)}% of a trailer</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-clay" style={{ width: `${Math.max(2, fill)}%` }} /></div>
        </div>
      )}
      {children}
    </div>
  );
}
