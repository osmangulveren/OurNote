"use client";

import { useState, useTransition } from "react";
import { ProductionStage } from "@prisma/client";
import { advanceProductionStage } from "@/lib/orders/production";

const STAGES: ProductionStage[] = [
  "WAITING",
  "FRAME_BUILDING",
  "UPHOLSTERY",
  "QUALITY_CHECK",
  "PACKAGING",
  "READY_FOR_LOADING",
  "LOADED_ON_TRUCK",
  "DEPARTED",
  "DELIVERED",
];
const LABEL: Record<ProductionStage, string> = {
  WAITING: "Bekliyor",
  FRAME_BUILDING: "İskelet yapılıyor",
  UPHOLSTERY: "Döşeme yapılıyor",
  QUALITY_CHECK: "Kalite kontrol",
  PACKAGING: "Paketlendi",
  READY_FOR_LOADING: "Yüklemeye hazır",
  LOADED_ON_TRUCK: "TIR&apos;a yüklendi",
  DEPARTED: "Yola çıktı",
  DELIVERED: "Teslim edildi",
};

export default function ProductionStageControls({
  orderId,
  current,
  hasShipment,
}: {
  orderId: string;
  current: ProductionStage;
  hasShipment: boolean;
}) {
  const idx = STAGES.indexOf(current);
  const next = idx < STAGES.length - 1 ? STAGES[idx + 1] : null;
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (!next) {
    return <p className="text-sm text-emerald-700">✓ Tüm aşamalar tamamlandı.</p>;
  }

  const blocked = next === "DEPARTED" && !hasShipment;

  return (
    <div className="space-y-3">
      <div className="text-sm">
        <span className="text-slate-500">Sıradaki aşama:</span>{" "}
        <span className="font-medium">{LABEL[next]}</span>
      </div>
      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        rows={2}
        placeholder="Aşama notu (opsiyonel) — örn. fotoğraf URL&apos;si, teslim alan kişi…"
        className="w-full text-sm rounded-lg border border-slate-300 px-3 py-2"
      />
      {blocked ? (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          DEPARTED&apos;a geçmek için önce TIR plakası ve şoför bilgisi girin.
        </p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <button
        disabled={pending || blocked}
        onClick={() => start(async () => {
          setError(null);
          const r = await advanceProductionStage(orderId, next, note.trim() || undefined);
          if ((r as any)?.error) setError((r as any).error);
          else setNote("");
        })}
        className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-sm rounded-lg px-3 py-2"
      >
        {pending ? "Kaydediliyor…" : `→ ${LABEL[next]}`}
      </button>
      <p className="text-[11px] text-slate-500">
        İleri alındığında müşteri otomatik bildirim alır. DEPARTED&apos;a geçişte stok düşer ve sevkiyat başlar.
      </p>
    </div>
  );
}
