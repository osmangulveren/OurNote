"use client";

import { useFormState, useFormStatus } from "react-dom";
import { updateCustomerProfile, type CustomerProfileState } from "@/lib/customers/actions";

const initial: CustomerProfileState = {};

export default function ProfileForm({ userId, defaults }: { userId: string; defaults: Record<string, string> }) {
  const action = updateCustomerProfile.bind(null, userId);
  const [state, formAction] = useFormState(action, initial);
  return (
    <form action={formAction} className="space-y-3 text-sm">
      <div>
        <label className="block text-xs text-slate-600 mb-1">Firma adı</label>
        <input name="companyName" defaultValue={defaults.companyName} required className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-slate-600 mb-1">VKN</label>
          <input name="taxNumber" defaultValue={defaults.taxNumber} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
        <div>
          <label className="block text-xs text-slate-600 mb-1">Telefon</label>
          <input name="phone" defaultValue={defaults.phone} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
        </div>
      </div>
      <div>
        <label className="block text-xs text-slate-600 mb-1">Adres</label>
        <textarea name="address" defaultValue={defaults.address} rows={2} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
      </div>
      <div>
        <label className="block text-xs text-slate-600 mb-1">Genel İskonto (%)</label>
        <input
          name="discountPercentage"
          type="number"
          step="0.01"
          min="0"
          max="100"
          defaultValue={defaults.discountPercentage}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
        <p className="text-[11px] text-slate-500 mt-1">
          Tüm ürünlere uygulanır. Ürün-bazlı override varsa o öncelikli.
        </p>
      </div>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-xs text-emerald-700">Kaydedildi.</p> : null}
      <Submit />
    </form>
  );
}
function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="bg-slate-900 text-white text-sm rounded-lg px-3 py-1.5 disabled:opacity-50">
      {pending ? "Kaydediliyor…" : "Profili kaydet"}
    </button>
  );
}
