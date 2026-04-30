"use client";

import { useState, useTransition } from "react";
import { addToCart } from "@/lib/cart/actions";

export default function AddToCartForm({ productId, maxQty }: { productId: string; maxQty: number }) {
  const [qty, setQty] = useState(1);
  const [msg, setMsg] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [pending, start] = useTransition();

  const disabled = maxQty <= 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="number"
          min={1}
          max={Math.max(1, maxQty)}
          value={qty}
          disabled={disabled}
          onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
          className="w-20 rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
        />
        <button
          type="button"
          disabled={disabled || pending}
          onClick={() => {
            setMsg(null);
            start(async () => {
              const res = await addToCart(productId, qty);
              if (res?.error) {
                setIsError(true);
                setMsg(res.error);
              } else {
                setIsError(false);
                setMsg("Sepete eklendi.");
              }
            });
          }}
          className="bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg"
        >
          {pending ? "Ekleniyor…" : "Sepete ekle"}
        </button>
      </div>
      {msg ? (
        <p className={`text-xs ${isError ? "text-red-600" : "text-emerald-700"}`}>{msg}</p>
      ) : null}
    </div>
  );
}
