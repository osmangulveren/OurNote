"use client";

import { useMemo, useState } from "react";
import { addToCart } from "@/app/actions/cart";

type Tier = { minQty: number; price: number };

export default function AddToCart({
  productId, moq, unit, colors, tiers, volumeM3,
}: { productId: string; moq: number; unit: string; colors: string[]; tiers: Tier[]; volumeM3: number }) {
  const [qty, setQty] = useState(moq);
  const price = useMemo(() => {
    let p = tiers[0]?.price ?? 0;
    for (const t of tiers) if (qty >= t.minQty) p = t.price;
    return p;
  }, [qty, tiers]);
  const fmt = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR" }).format(n);

  return (
    <form action={addToCart} className="space-y-4">
      <input type="hidden" name="productId" value={productId} />
      {colors.length > 0 && (
        <div>
          <label className="label">Colour</label>
          <select name="color" className="input" defaultValue={colors[0]}>
            {colors.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
      )}
      <div>
        <label className="label">Quantity ({unit}) · minimum {moq}</label>
        <div className="flex items-center gap-2">
          <button type="button" className="btn-outline px-3" onClick={() => setQty((q) => Math.max(moq, q - 1))}>−</button>
          <input name="quantity" type="number" min={moq} value={qty} onChange={(e) => setQty(Math.max(moq, Number(e.target.value) || moq))} className="input w-24 text-center" />
          <button type="button" className="btn-outline px-3" onClick={() => setQty((q) => q + 1)}>+</button>
        </div>
      </div>
      <div className="rounded-lg bg-slate-50 p-4 text-sm">
        <div className="flex justify-between"><span>Unit price</span><b>{fmt(price)}</b></div>
        <div className="flex justify-between"><span>Line total (excl. VAT)</span><b className="text-brand-700">{fmt(price * qty)}</b></div>
        {volumeM3 > 0 && <div className="flex justify-between text-slate-500"><span>Volume</span><span>{(volumeM3 * qty).toFixed(2)} m³</span></div>}
      </div>
      <div className="flex gap-2">
        <button className="btn-primary flex-1">Add to cart</button>
        <button name="goToCart" value="1" className="btn-accent flex-1">Add & checkout</button>
      </div>
    </form>
  );
}
