"use client";

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="bg-slate-900 hover:bg-slate-800 text-white text-sm rounded-lg px-3 py-1.5"
    >
      Yazdır
    </button>
  );
}
