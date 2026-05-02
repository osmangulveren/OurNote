"use client";

import { useEffect, useRef, useState } from "react";

type State =
  | { kind: "idle" }
  | { kind: "requesting" }
  | { kind: "running"; lat: number; lng: number; at: Date; sent: number; failed: number }
  | { kind: "denied" }
  | { kind: "error"; message: string };

export default function DriverBeacon({ token, active }: { token: string; active: boolean }) {
  const [state, setState] = useState<State>({ kind: "idle" });
  const watchIdRef = useRef<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const lastPos = useRef<{ lat: number; lng: number } | null>(null);
  const counts = useRef({ sent: 0, failed: 0 });

  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
      if (intervalRef.current !== null) clearInterval(intervalRef.current);
    };
  }, []);

  if (!active) {
    return (
      <div className="bg-amber-100 text-amber-900 rounded-2xl p-4 text-sm">
        Bu sevkiyat tamamlanmış veya iptal edilmiş; konum gönderimi durduruldu.
      </div>
    );
  }

  function start() {
    if (!navigator.geolocation) {
      setState({ kind: "error", message: "Tarayıcınız konum desteği vermiyor." });
      return;
    }
    setState({ kind: "requesting" });
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        lastPos.current = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setState((s) => ({
          kind: "running",
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          at: new Date(),
          sent: counts.current.sent,
          failed: counts.current.failed,
        }));
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) setState({ kind: "denied" });
        else setState({ kind: "error", message: err.message });
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 },
    );
    intervalRef.current = window.setInterval(async () => {
      if (!lastPos.current) return;
      try {
        const res = await fetch("/api/driver/ping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, ...lastPos.current }),
        });
        if (res.ok) counts.current.sent += 1;
        else counts.current.failed += 1;
      } catch {
        counts.current.failed += 1;
      }
      setState((s) => s.kind === "running" ? { ...s, sent: counts.current.sent, failed: counts.current.failed } : s);
    }, 30000);
  }

  function stop() {
    if (watchIdRef.current !== null) navigator.geolocation.clearWatch(watchIdRef.current);
    if (intervalRef.current !== null) clearInterval(intervalRef.current);
    watchIdRef.current = null;
    intervalRef.current = null;
    setState({ kind: "idle" });
  }

  return (
    <div className="bg-white text-slate-900 rounded-2xl p-4 space-y-3 text-sm">
      {state.kind === "idle" ? (
        <button
          onClick={start}
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl font-medium"
        >
          Konum Paylaşımını Başlat
        </button>
      ) : state.kind === "requesting" ? (
        <p className="text-slate-700">Konum izni isteniyor…</p>
      ) : state.kind === "running" ? (
        <>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-medium">Yayında</span>
          </div>
          <div className="text-xs text-slate-600 space-y-1">
            <div>Son konum: {state.lat.toFixed(5)}, {state.lng.toFixed(5)}</div>
            <div>Son güncelleme: {state.at.toLocaleTimeString("tr-TR")}</div>
            <div>Gönderildi: {state.sent} · Hata: {state.failed}</div>
          </div>
          <button
            onClick={stop}
            className="w-full bg-slate-200 hover:bg-slate-300 text-slate-900 py-2 rounded-lg text-sm"
          >
            Yayını durdur
          </button>
        </>
      ) : state.kind === "denied" ? (
        <p className="text-red-700">Konum izni verilmedi. Tarayıcı ayarlarından izin verip yeniden deneyin.</p>
      ) : (
        <p className="text-red-700">Hata: {state.message}</p>
      )}
    </div>
  );
}
