"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { ProductFormState } from "@/lib/products/actions";

const initial: ProductFormState = {};

interface Props {
  action: (prev: ProductFormState, fd: FormData) => Promise<ProductFormState>;
  defaults?: {
    sku?: string;
    name?: string;
    description?: string | null;
    unit?: string;
    price?: string;
    vatRate?: string;
    stockQuantity?: number;
    isActive?: boolean;
  };
  submitLabel?: string;
}

export default function ProductForm({ action, defaults, submitLabel = "Kaydet" }: Props) {
  const [state, formAction] = useFormState(action, initial);
  return (
    <form action={formAction} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="SKU" name="sku" defaultValue={defaults?.sku} required />
        <Field label="Birim (adet, paket, …)" name="unit" defaultValue={defaults?.unit ?? "adet"} required />
      </div>
      <Field label="Ürün adı" name="name" defaultValue={defaults?.name} required />
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Açıklama</label>
        <textarea
          name="description"
          defaultValue={defaults?.description ?? ""}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Field label="Birim fiyat (TL)" name="price" type="number" step="0.01" min="0" defaultValue={defaults?.price ?? "0"} required />
        <Field label="KDV (%)" name="vatRate" type="number" step="0.01" min="0" max="100" defaultValue={defaults?.vatRate ?? "20"} required />
        <Field label="Stok miktarı" name="stockQuantity" type="number" min="0" defaultValue={String(defaults?.stockQuantity ?? 0)} required />
      </div>
      <label className="inline-flex items-center gap-2 text-sm">
        <input type="checkbox" name="isActive" defaultChecked={defaults?.isActive ?? true} />
        Aktif (müşteriler katalogda görsün)
      </label>

      {state.error ? (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{state.error}</p>
      ) : null}

      <Submit label={submitLabel} />
    </form>
  );
}

function Field(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, ...rest } = props;
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input {...rest} className="w-full rounded-lg border border-slate-300 px-3 py-2" />
    </div>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium px-5 py-2.5 rounded-lg"
    >
      {pending ? "Kaydediliyor…" : label}
    </button>
  );
}
