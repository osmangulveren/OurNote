"use client";

import { useTransition, useState } from "react";
import { placeOrder } from "@/lib/orders/actions";

export default function PlaceOrderButton() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-2 pt-2">
      <button
        disabled={pending}
        onClick={() => start(async () => {
          setError(null);
          try {
            const res = await placeOrder();
            if (res && (res as any).error) setError((res as any).error);
          } catch (e: any) {
            // Server actions throwing redirect propagate; only catch real errors
            if (e?.message && !String(e.message).includes("NEXT_REDIRECT")) {
              setError(e.message);
            }
          }
        })}
        className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-2.5 rounded-lg"
      >
        {pending ? "Sipariş veriliyor…" : "Siparişi onayla"}
      </button>
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
