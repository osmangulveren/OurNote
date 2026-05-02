"use client";

import { useFormState, useFormStatus } from "react-dom";
import { createAdminUser, type AdminUserState } from "@/lib/users/actions";
import { ROLE_LABEL } from "@/lib/auth/permissions";

const ROLE_OPTIONS = Object.entries(ROLE_LABEL).filter(([k]) => k !== "CUSTOMER" && k !== "ADMIN");
const initial: AdminUserState = {};

export default function CreateUserForm() {
  const [state, action] = useFormState(createAdminUser, initial);
  return (
    <form action={action} className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
      <input name="name" placeholder="Ad Soyad" required className="rounded-lg border border-slate-300 px-3 py-2" />
      <input name="email" type="email" placeholder="email@firma.com" required className="rounded-lg border border-slate-300 px-3 py-2" />
      <select name="role" defaultValue="OPERATIONS" className="rounded-lg border border-slate-300 px-3 py-2 bg-white">
        {ROLE_OPTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
      </select>
      <input name="password" type="password" placeholder="Şifre (min 6)" required className="rounded-lg border border-slate-300 px-3 py-2" />
      <div className="sm:col-span-2 flex items-center gap-3">
        <Submit />
        {state.error ? <span className="text-red-600 text-xs">{state.error}</span> : null}
        {state.ok ? <span className="text-emerald-700 text-xs">Eklendi.</span> : null}
      </div>
    </form>
  );
}
function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="bg-slate-900 text-white text-sm rounded-lg px-3 py-1.5 disabled:opacity-50">
      {pending ? "Ekleniyor…" : "Personel ekle"}
    </button>
  );
}
