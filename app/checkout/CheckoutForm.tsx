"use client";

import { useActionState } from "react";
import { placeOrder } from "@/app/actions/orders";

type Defaults = { name: string; address: string; city: string; postal: string; country: string; phone: string };

export default function CheckoutForm({
  defaults, countries, stripeEnabled, total,
}: { defaults: Defaults; countries: [string, string][]; stripeEnabled: boolean; total: string }) {
  const [state, action, pending] = useActionState(placeOrder, undefined);
  return (
    <form action={action} className="space-y-6">
      <section className="card grid gap-4 p-6 sm:grid-cols-2">
        <h2 className="font-bold sm:col-span-2">Delivery address (your store)</h2>
        <div className="sm:col-span-2"><label className="label">Store / company name</label><input name="deliveryName" defaultValue={defaults.name} required className="input" /></div>
        <div className="sm:col-span-2"><label className="label">Address</label><input name="deliveryAddress" defaultValue={defaults.address} required className="input" /></div>
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
          <label className="label">Notes (unloading, opening hours…)</label>
          <textarea name="notes" rows={3} className="input" placeholder="e.g. Ramp available, deliveries Mon–Fri 8:00–16:00" />
        </div>
      </section>

      <section className="card space-y-3 p-6">
        <h2 className="font-bold">Payment</h2>
        {stripeEnabled && (
          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
            <input type="radio" name="paymentMethod" value="STRIPE" defaultChecked className="mt-1" />
            <span><b>Pay online now</b><span className="muted block">Card, SEPA debit and other methods via Stripe. Your order is confirmed immediately.</span></span>
          </label>
        )}
        <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-4 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50">
          <input type="radio" name="paymentMethod" value="BANK_TRANSFER" defaultChecked={!stripeEnabled} className="mt-1" />
          <span><b>Bank transfer (proforma invoice)</b><span className="muted block">We send a proforma; production starts when the transfer arrives.</span></span>
        </label>
      </section>

      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button className="btn-accent w-full py-3 text-base" disabled={pending}>
        {pending ? "Placing order…" : `Place order · ${total}`}
      </button>
    </form>
  );
}
