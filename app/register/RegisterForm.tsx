"use client";

import { useActionState } from "react";
import { register } from "@/app/actions/auth";

export default function RegisterForm({ countries }: { countries: [string, string][] }) {
  const [state, action, pending] = useActionState(register, undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <fieldset className="contents">
        <legend className="col-span-full font-mono text-[11px] uppercase tracking-[0.16em] text-stone">01 — Your store</legend>
        <div className="sm:col-span-2">
          <label className="label">Company name</label>
          <input name="companyName" required className="input" />
        </div>
        <div>
          <label className="label">Country</label>
          <select name="country" required className="input" defaultValue="">
            <option value="" disabled>Select…</option>
            {countries.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
          </select>
        </div>
        <div>
          <label className="label">VAT number (EU VAT ID)</label>
          <input name="vatNumber" className="input" placeholder="e.g. DE123456789" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Store / delivery address</label>
          <input name="address" required className="input" />
        </div>
        <div>
          <label className="label">City</label>
          <input name="city" required className="input" />
        </div>
        <div>
          <label className="label">Postal code</label>
          <input name="postalCode" required className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Phone</label>
          <input name="phone" required className="input" />
        </div>
      </fieldset>
      <fieldset className="contents">
        <legend className="col-span-full mt-4 font-mono text-[11px] uppercase tracking-[0.16em] text-stone">02 — Your login</legend>
        <div>
          <label className="label">Your name</label>
          <input name="name" required className="input" />
        </div>
        <div>
          <label className="label">Email</label>
          <input name="email" type="email" required className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="label">Password (min. 8 characters)</label>
          <input name="password" type="password" minLength={8} required className="input" />
        </div>
      </fieldset>
      {state?.error && <p className="text-sm text-clay-2 sm:col-span-2">{state.error}</p>}
      <button className="btn-primary py-3 sm:col-span-2" disabled={pending}>{pending ? "Submitting…" : "Apply for a trade account"}</button>
    </form>
  );
}
