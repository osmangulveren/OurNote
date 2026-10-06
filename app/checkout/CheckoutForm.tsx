"use client";

import { useActionState, useMemo, useState } from "react";
import { placeOrder } from "@/app/actions/orders";
import { TrailerStage } from "@/components/three";
import { otherCrates, type PlanItem } from "@/lib/loadplan";

type Defaults = { name: string; address: string; city: string; postal: string; country: string; phone: string };
type Dep = { id: string; code: string; route: string; departAt: string | null; eta: string | null; cutoffAt: string | null; booked: number; free: number; capacity: number; stores: number };

const eur = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);
const d = (s: string | null) => (s ? new Date(s).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—");

function Step({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <section className="border-t border-line pt-8">
      <div className="mb-6 flex items-baseline gap-4">
        <span className="font-mono text-xs text-stone">{n}</span>
        <h2 className="font-display text-4xl leading-none">{title}</h2>
      </div>
      {children}
    </section>
  );
}

export default function CheckoutForm({
  defaults, countries, stripeEnabled, total, volume, depositPercent, departures, readyBy, mine,
}: {
  defaults: Defaults; countries: [string, string][]; stripeEnabled: boolean; total: number; volume: number;
  depositPercent: number; departures: Dep[]; readyBy: string; mine: PlanItem[];
}) {
  const [state, action, pending] = useActionState(placeOrder, undefined);
  const usable = (x: Dep) => x.free >= volume && (!x.departAt || new Date(x.departAt) >= new Date(readyBy));
  const [dep, setDep] = useState<string>(departures.find(usable)?.id ?? "");
  const [plan, setPlan] = useState<"DEPOSIT" | "FULL">("DEPOSIT");
  const chosen = departures.find((x) => x.id === dep);
  const items = useMemo(() => {
    const others = chosen ? otherCrates(chosen.booked) : null;
    return others ? [others, ...mine] : mine;
  }, [chosen, mine]);
  const due = plan === "DEPOSIT" ? Math.round(total * depositPercent) / 100 : total;

  return (
    <form action={action} className="space-y-12">
      <input type="hidden" name="departureId" value={dep} />
      <input type="hidden" name="paymentPlan" value={plan} />

      <Step n="01" title="Where to">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Store / company</label><input name="deliveryName" defaultValue={defaults.name} required className="input" /></div>
          <div className="sm:col-span-2"><label className="label">Street address</label><input name="deliveryAddress" defaultValue={defaults.address} required className="input" /></div>
          <div><label className="label">City</label><input name="deliveryCity" defaultValue={defaults.city} required className="input" /></div>
          <div><label className="label">Postal code</label><input name="deliveryPostal" defaultValue={defaults.postal} required className="input" /></div>
          <div>
            <label className="label">Country</label>
            <select name="deliveryCountry" defaultValue={defaults.country} className="input">
              {countries.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
          </div>
          <div><label className="label">Phone for the driver</label><input name="deliveryPhone" defaultValue={defaults.phone} required className="input" /></div>
          <div className="sm:col-span-2">
            <label className="label">Unloading notes</label>
            <textarea name="notes" rows={2} className="input" placeholder="Ramp or kerbside? Opening hours? Max truck length on your street?" />
          </div>
        </div>
      </Step>

      <Step n="02" title="Which truck">
        <div className="overflow-hidden rounded-[22px] bg-paper ring-1 ring-line">
          <TrailerStage items={items} className="h-[300px]" />
          <div className="flex flex-wrap gap-4 border-t border-line px-5 py-3 font-mono text-[10px] uppercase tracking-wider text-stone">
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-clay" />Your pieces · {volume.toFixed(2)} m³</span>
            {chosen && <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-sm bg-stone-2" />{chosen.stores} other store{chosen.stores === 1 ? "" : "s"} · {chosen.booked.toFixed(1)} m³</span>}
          </div>
        </div>
        <div className="mt-4 space-y-2">
          {departures.map((x) => {
            const ok = usable(x);
            const pct = ((x.booked + (dep === x.id ? volume : 0)) / x.capacity) * 100;
            return (
              <button
                type="button"
                key={x.id}
                disabled={!ok}
                onClick={() => setDep(x.id)}
                className={`grid w-full gap-3 rounded-2xl p-4 text-left ring-1 transition sm:grid-cols-[1fr_1.3fr_auto] sm:items-center ${dep === x.id ? "bg-ink text-paper ring-ink" : "bg-paper ring-line hover:ring-ink/30"} disabled:cursor-not-allowed disabled:opacity-45`}
              >
                <div>
                  <div className="font-mono text-[11px] tracking-wider opacity-60">{x.code}</div>
                  <div className="font-display text-2xl leading-none">Leaves {d(x.departAt)}</div>
                </div>
                <div className="text-sm">
                  <div className="truncate opacity-75">{x.route}</div>
                  <div className={`mt-2 h-1 overflow-hidden rounded-full ${dep === x.id ? "bg-white/15" : "bg-line"}`}>
                    <div className="h-full rounded-full bg-clay" style={{ width: `${Math.min(100, pct)}%` }} />
                  </div>
                </div>
                <div className="text-right text-sm">
                  <div>At your store ~{d(x.eta)}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider opacity-60">
                    {!ok ? (x.free < volume ? "Not enough space" : "Too soon for production") : `Book by ${d(x.cutoffAt)}`}
                  </div>
                </div>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => setDep("")}
            className={`w-full rounded-2xl p-4 text-left ring-1 transition ${dep === "" ? "bg-ink text-paper ring-ink" : "bg-paper ring-line hover:ring-ink/30"}`}
          >
            <div className="font-display text-2xl leading-none">First truck after production</div>
            <div className="mt-1 text-sm opacity-70">Ready around {d(readyBy)} — we&apos;ll put you on the next truck to your region and confirm the date.</div>
          </button>
        </div>
      </Step>

      <Step n="03" title="How to pay">
        <div className="grid gap-3 sm:grid-cols-2">
          {([
            ["DEPOSIT", `${depositPercent}% now, rest before loading`, `Pay ${eur(Math.round(total * depositPercent) / 100)} to start production. The balance is due when your pieces are ready to load.`],
            ["FULL", "Pay in full", `Pay ${eur(total)} now. Nothing more to think about.`],
          ] as const).map(([k, t, s]) => (
            <button type="button" key={k} onClick={() => setPlan(k)} className={`rounded-2xl p-5 text-left ring-1 transition ${plan === k ? "bg-ink text-paper ring-ink" : "bg-paper ring-line hover:ring-ink/30"}`}>
              <div className="font-display text-2xl leading-none">{t}</div>
              <div className="mt-2 text-sm opacity-70">{s}</div>
            </button>
          ))}
        </div>
        <div className="mt-4 space-y-2">
          {stripeEnabled && (
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-paper p-4 ring-1 ring-line has-[:checked]:ring-ink">
              <input type="radio" name="paymentMethod" value="STRIPE" defaultChecked className="accent-ink" />
              <span><b className="font-medium">Card or SEPA debit</b> <span className="text-ink-3">— confirmed instantly via Stripe</span></span>
            </label>
          )}
          <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-paper p-4 ring-1 ring-line has-[:checked]:ring-ink">
            <input type="radio" name="paymentMethod" value="BANK_TRANSFER" defaultChecked={!stripeEnabled} className="accent-ink" />
            <span><b className="font-medium">Bank transfer</b> <span className="text-ink-3">— proforma invoice issued immediately</span></span>
          </label>
        </div>
      </Step>

      {state?.error && <p className="rounded-xl bg-clay-3 p-3 text-sm text-clay-2">{state.error}</p>}
      <button className="btn-accent w-full py-4 text-base" disabled={pending}>
        {pending ? "Placing order…" : `Place order · ${eur(due)} due now`}
      </button>
    </form>
  );
}
