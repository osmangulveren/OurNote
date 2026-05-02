"use client";

import { useFormState, useFormStatus } from "react-dom";
import { upsertShipment, type ShipmentFormState } from "@/lib/shipments/actions";

const initial: ShipmentFormState = {};

export default function ShipmentForm({
  orderId,
  defaults,
  trackingToken,
}: {
  orderId: string;
  defaults: { truckPlate: string; driverName: string; driverPhone: string; etaAt: string };
  trackingToken?: string;
}) {
  const action = upsertShipment.bind(null, orderId);
  const [state, formAction] = useFormState(action, initial);

  const driverUrl = trackingToken
    ? (typeof window !== "undefined" ? `${window.location.origin}/driver/${trackingToken}` : `/driver/${trackingToken}`)
    : null;

  return (
    <form action={formAction} className="space-y-3 text-sm">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="TIR Plakası" name="truckPlate" required defaultValue={defaults.truckPlate} placeholder="34 ABC 123" />
        <Field label="Şoför Adı" name="driverName" required defaultValue={defaults.driverName} />
        <Field label="Şoför Telefon" name="driverPhone" defaultValue={defaults.driverPhone} placeholder="+90 …" />
        <Field label="Tahmini Varış" name="etaAt" type="datetime-local" defaultValue={defaults.etaAt} />
      </div>
      {state.error ? <p className="text-xs text-red-600">{state.error}</p> : null}
      {state.ok ? <p className="text-xs text-emerald-700">Kaydedildi.</p> : null}
      <div className="flex items-center gap-3">
        <Submit />
        {driverUrl ? (
          <a
            href={driverUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs text-slate-700 underline"
          >
            Şoför linkini aç
          </a>
        ) : null}
      </div>
      {trackingToken ? (
        <p className="text-[11px] text-slate-500 break-all">
          Şoföre WhatsApp ile bu linki gönderin:{" "}
          <code className="bg-slate-100 px-1 py-0.5 rounded">
            /driver/{trackingToken}
          </code>
        </p>
      ) : (
        <p className="text-[11px] text-slate-500">
          Bilgileri kaydedince şoför takip linki üretilir.
        </p>
      )}
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="block text-xs text-slate-600 mb-1">{label}</label>
      <input {...rest} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
    </div>
  );
}
function Submit() {
  const { pending } = useFormStatus();
  return (
    <button disabled={pending} className="bg-slate-900 text-white text-sm rounded-lg px-3 py-1.5 disabled:opacity-50">
      {pending ? "Kaydediliyor…" : "Sevkiyat bilgisini kaydet"}
    </button>
  );
}
