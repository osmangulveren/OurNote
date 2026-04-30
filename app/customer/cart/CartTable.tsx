"use client";

import { useState, useTransition } from "react";
import { updateCartItem, removeCartItem } from "@/lib/cart/actions";
import { formatTRY } from "@/lib/money";

interface Item {
  id: string;
  productId: string;
  name: string;
  sku: string;
  unit: string;
  quantity: number;
  available: number;
  unitPrice: string;
  listPrice?: string;
  vatRate: string;
}

export default function CartTable({ items }: { items: Item[] }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-2">Ürün</th>
            <th className="px-4 py-2 text-right">Birim Fiyat</th>
            <th className="px-4 py-2 text-right">Miktar</th>
            <th className="px-4 py-2 text-right">Tutar</th>
            <th className="px-4 py-2"></th>
          </tr>
        </thead>
        <tbody>
          {items.map((it) => (
            <Row key={it.id} item={it} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Row({ item }: { item: Item }) {
  const [qty, setQty] = useState(item.quantity);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const lineTotal = Number(item.unitPrice) * qty * (1 + Number(item.vatRate) / 100);

  return (
    <tr className="border-t border-slate-100">
      <td className="px-4 py-2">
        <div className="font-medium">{item.name}</div>
        <div className="text-xs text-slate-500 font-mono">{item.sku}</div>
      </td>
      <td className="px-4 py-2 text-right">
        {item.listPrice && Number(item.listPrice) > Number(item.unitPrice) ? (
          <div>
            <div className="text-xs text-slate-400 line-through">{formatTRY(item.listPrice)}</div>
            <div className="text-emerald-700 font-medium">{formatTRY(item.unitPrice)}</div>
          </div>
        ) : (
          formatTRY(item.unitPrice)
        )}
      </td>
      <td className="px-4 py-2 text-right">
        <div className="inline-flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={item.available}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className="w-16 rounded border border-slate-300 px-2 py-1 text-right"
          />
          <button
            onClick={() => start(async () => {
              setMsg(null);
              const res = await updateCartItem(item.id, qty);
              if (res?.error) setMsg(res.error);
            })}
            disabled={pending}
            className="text-xs text-slate-700 underline"
          >
            güncelle
          </button>
        </div>
        {msg ? <p className="text-[11px] text-red-600 mt-1">{msg}</p> : null}
      </td>
      <td className="px-4 py-2 text-right">{formatTRY(lineTotal)}</td>
      <td className="px-4 py-2 text-right">
        <button
          onClick={() => start(async () => { await removeCartItem(item.id); })}
          disabled={pending}
          className="text-xs text-red-600 hover:underline"
        >
          Kaldır
        </button>
      </td>
    </tr>
  );
}
