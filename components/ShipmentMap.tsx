"use client";

import dynamic from "next/dynamic";

const Inner = dynamic(() => import("./ShipmentMapInner"), {
  ssr: false,
  loading: () => <div className="h-72 bg-slate-100 rounded-2xl flex items-center justify-center text-sm text-slate-500">Harita yükleniyor…</div>,
});

export default function ShipmentMap(props: { lat: number; lng: number; label?: string }) {
  return <Inner {...props} />;
}
