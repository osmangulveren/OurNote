"use client";

import { useState, useTransition } from "react";
import { setCustomerProductPrice } from "@/lib/customers/actions";
import { formatTRY } from "@/lib/money";

interface Row {
  id: string;
  sku: string;
  name: string;
  listPrice: string;
  overridePrice: string;
  effective: string;
}

export default function PriceOverridesTable({ customerId, rows }: { customerId: string; rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-left text-slate-500"><tr>
          <th className="py-2">SKU</th><th>Ürün</th>
          <th className="text-right">Liste fiyatı</th>
          <th className="text-right">Özel fiyat</th>
          <th className="text-right">Geçerli (önizleme)</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => <Row key={r.id} customerId={customerId} row={r} />)}
        </tbody>
      </table>
    </div>
  );
}

function Row({ customerId, row }: { customerId: string; row: Row }) {
  const [val, setVal] = useState(row.overridePrice);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <tr className="border-t border-slate-100">
      <td className="py-2 font-mono text-xs">{row.sku}</td>
      <td>{row.name}</td>
      <td className="text-right">{formatTRY(row.listPrice)}</td>
      <td className="text-right">
        <div className="inline-flex items-center gap-1">
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            placeholder="—"
            className="w-28 rounded border border-slate-300 px-2 py-1 text-right"
          />
          <button
            disabled={pending}
            onClick={() => start(async () => {
              setMsg(null);
              const res = await setCustomerProductPrice(customerId, row.id, val);
              if ((res as any)?.error) setMsg((res as any).error);
            })}
            className="text-xs text-slate-700 underline"
          >
            kaydet
          </button>
        </div>
        {msg ? <p className="text-[11px] text-red-600">{msg}</p> : null}
      </td>
      <td className="text-right">{formatTRY(val.trim() === "" ? row.effective : val)}</td>
    </tr>
  );
}
