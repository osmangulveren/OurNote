"use client";

import { useState, useTransition } from "react";
import { placeOrder } from "@/lib/orders/actions";

const PAYMENT_METHODS: Array<{ value: string; label: string; sub: string }> = [
  { value: "WIRE_TRANSFER", label: "Havale / EFT", sub: "Banka hesabımıza havale" },
  { value: "CREDIT_CARD", label: "Kredi Kartı", sub: "Sipariş onayı sonrası link gönderilir" },
  { value: "BANK_CARD", label: "Banka Kartı", sub: "POS / link" },
  { value: "CASH", label: "Nakit", sub: "Ofis tahsilatı" },
  { value: "CHECK", label: "Çek", sub: "Vadeli çek" },
  { value: "CASH_ON_DELIVERY", label: "Kapıda Ödeme", sub: "Teslim anında" },
];

export default function CheckoutPanel({
  subtotal, vat, grand,
}: { subtotal: string; vat: string; grand: string }) {
  const [method, setMethod] = useState("WIRE_TRANSFER");
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit() {
    setError(null);
    start(async () => {
      const fd = new FormData();
      fd.set("paymentMethod", method);
      try {
        const r = await placeOrder(fd);
        if (r && (r as any).error) setError((r as any).error);
      } catch (e: any) {
        if (e?.message && !String(e.message).includes("NEXT_REDIRECT")) {
          setError(e.message);
        }
      }
    });
  }

  return (
    <aside className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 lg:sticky lg:top-6">
      <div>
        <h3 className="font-semibold mb-2">Ödeme Yöntemi</h3>
        <div className="space-y-2">
          {PAYMENT_METHODS.map((p) => {
            const active = method === p.value;
            return (
              <label key={p.value} className={`flex items-start gap-3 rounded-xl border-2 px-3 py-2 cursor-pointer transition ${active ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400"}`}>
                <input type="radio" name="paymentMethod" value={p.value} checked={active} onChange={() => setMethod(p.value)} className="mt-0.5 accent-slate-900" />
                <div>
                  <div className="text-sm font-medium">{p.label}</div>
                  <div className="text-xs text-slate-500">{p.sub}</div>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div className="border-t border-slate-200 pt-3 space-y-1 text-sm">
        <Row label="Ara Toplam" value={subtotal} />
        <Row label="KDV" value={vat} />
        <Row label="Genel Toplam" value={grand} bold />
      </div>

      <button
        disabled={pending}
        onClick={submit}
        className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-3 rounded-full"
      >
        {pending ? "Sipariş veriliyor…" : "Siparişi onayla"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </aside>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>
      <span>{label}</span><span>{value}</span>
    </div>
  );
}
