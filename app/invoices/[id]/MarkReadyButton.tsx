"use client";

import { useTransition, useState } from "react";
import { markInvoiceReadyForAccounting } from "@/lib/invoices/actions";

export default function MarkReadyButton({ invoiceId }: { invoiceId: string }) {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  if (done) {
    return <span className="text-xs text-emerald-700">✓ Muhasebeye gönderildi</span>;
  }

  return (
    <button
      disabled={pending}
      onClick={() => start(async () => {
        const r = await markInvoiceReadyForAccounting(invoiceId);
        if ((r as any).ok) setDone(true);
      })}
      className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm rounded-lg px-3 py-1.5"
    >
      {pending ? "Gönderiliyor…" : "Muhasebeye gönder (taslak)"}
    </button>
  );
}
