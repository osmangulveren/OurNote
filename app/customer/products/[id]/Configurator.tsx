"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { addToCart } from "@/lib/cart/actions";
import { formatTRY } from "@/lib/money";

interface FabricColor { name: string; hex: string }
interface Composition { label: string; priceMultiplier: number }
interface Addon { label: string; priceDelta: number }

interface Props {
  productId: string;
  productName: string;
  sku: string;
  unit: string;
  baseEffectivePrice: string;
  listPrice: string | null;
  available: number;
  leadTimeDays: number | null;
  images: Array<{ url: string; alt: string }>;
  availableFabricColors: FabricColor[];
  availableCompositions: Composition[];
  availableAddons: Addon[];
}

export default function Configurator(p: Props) {
  const [imageIdx, setImageIdx] = useState(0);
  const [zoom, setZoom] = useState(false);
  const [color, setColor] = useState<FabricColor | null>(p.availableFabricColors[0] ?? null);
  const [composition, setComposition] = useState<Composition | null>(
    p.availableCompositions.find((c) => c.priceMultiplier === 1) ?? p.availableCompositions[0] ?? null,
  );
  const [addons, setAddons] = useState<Addon[]>([]);
  const [qty, setQty] = useState(1);
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ ok: boolean; msg: string } | null>(null);

  const base = Number(p.baseEffectivePrice);
  const compMul = composition?.priceMultiplier ?? 1;
  const addonsTotal = addons.reduce((s, a) => s + a.priceDelta, 0);
  const unitPrice = base * compMul + addonsTotal;
  const lineTotal = unitPrice * qty;

  const summary = useMemo(() => {
    const parts: string[] = [];
    if (composition) parts.push(composition.label);
    if (color) parts.push(color.name);
    if (addons.length) parts.push(addons.map((a) => a.label).join(" + "));
    return parts.join(" · ");
  }, [composition, color, addons]);

  function toggleAddon(a: Addon) {
    setAddons((cur) => cur.some((x) => x.label === a.label)
      ? cur.filter((x) => x.label !== a.label)
      : [...cur, a]);
  }

  function submit() {
    setFeedback(null);
    const configuration = {
      composition: composition ? { label: composition.label, priceMultiplier: composition.priceMultiplier } : null,
      fabricColor: color ? { name: color.name, hex: color.hex } : null,
      addons: addons.map((a) => ({ label: a.label, priceDelta: a.priceDelta })),
      summary,
      priceDelta: addonsTotal + base * (compMul - 1),
    };
    start(async () => {
      const res = await addToCart(p.productId, qty, configuration);
      if ((res as any)?.error) setFeedback({ ok: false, msg: (res as any).error });
      else setFeedback({ ok: true, msg: "Sepete eklendi." });
    });
  }

  return (
    <section className="max-w-6xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-10 py-8">
      {/* Görsel */}
      <div className="lg:sticky lg:top-6 self-start space-y-3">
        {p.images.length > 0 ? (
          <button
            type="button"
            onClick={() => setZoom(true)}
            className="block w-full aspect-square relative bg-slate-100 rounded-3xl overflow-hidden"
            aria-label="Görseli büyüt"
          >
            <Image src={p.images[imageIdx].url} alt={p.images[imageIdx].alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" priority unoptimized />
          </button>
        ) : <div className="aspect-square bg-slate-100 rounded-3xl" />}
        {p.images.length > 1 ? (
          <div className="flex gap-2 overflow-x-auto">
            {p.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setImageIdx(i)}
                className={`w-20 h-20 relative flex-shrink-0 rounded-xl overflow-hidden border-2 ${i === imageIdx ? "border-slate-900" : "border-transparent"}`}
                aria-label={`Görsel ${i + 1}`}
              >
                <Image src={img.url} alt={img.alt} fill className="object-cover" sizes="80px" unoptimized />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {/* Konfigüratör */}
      <div className="space-y-8">
        {p.availableCompositions.length > 0 ? (
          <Group title="Kompozisyon">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {p.availableCompositions.map((c) => {
                const active = composition?.label === c.label;
                const priceText = c.priceMultiplier === 1 ? "Standart" : `×${c.priceMultiplier}`;
                return (
                  <button
                    key={c.label}
                    onClick={() => setComposition(c)}
                    className={`text-left rounded-xl border-2 px-3 py-2 transition ${active ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400"}`}
                  >
                    <div className="text-sm font-medium">{c.label}</div>
                    <div className="text-xs text-slate-500">{priceText}</div>
                  </button>
                );
              })}
            </div>
          </Group>
        ) : null}

        {p.availableFabricColors.length > 0 ? (
          <Group title="Kumaş Rengi" subtitle={color?.name ?? "Seçiniz"}>
            <div className="flex flex-wrap gap-3">
              {p.availableFabricColors.map((c) => {
                const active = color?.name === c.name;
                return (
                  <button
                    key={c.name}
                    onClick={() => setColor(c)}
                    className={`w-10 h-10 rounded-full border-2 transition ${active ? "border-slate-900 scale-110" : "border-slate-200 hover:border-slate-400"}`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                    aria-label={c.name}
                  />
                );
              })}
            </div>
          </Group>
        ) : null}

        {p.availableAddons.length > 0 ? (
          <Group title="Ek Ürünler" subtitle="İstediğiniz kadar seçin">
            <div className="space-y-2">
              {p.availableAddons.map((a) => {
                const checked = addons.some((x) => x.label === a.label);
                return (
                  <label key={a.label} className={`flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 cursor-pointer transition ${checked ? "border-slate-900 bg-slate-50" : "border-slate-200 hover:border-slate-400"}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={checked} onChange={() => toggleAddon(a)} className="w-4 h-4 accent-slate-900" />
                      <span className="text-sm font-medium">{a.label}</span>
                    </div>
                    <span className="text-sm text-slate-700">+{formatTRY(a.priceDelta)}</span>
                  </label>
                );
              })}
            </div>
          </Group>
        ) : null}

        <Group title="Adet">
          <div className="inline-flex items-center gap-2">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-9 h-9 rounded-full border border-slate-300 text-lg"
              aria-label="Azalt"
            >−</button>
            <input
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(p.available, Number(e.target.value) || 1)))}
              className="w-16 text-center rounded-lg border border-slate-300 py-1.5"
            />
            <button
              onClick={() => setQty((q) => Math.min(p.available, q + 1))}
              className="w-9 h-9 rounded-full border border-slate-300 text-lg"
              aria-label="Arttır"
            >+</button>
          </div>
        </Group>

        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs uppercase tracking-wide text-slate-500">Birim Fiyat</div>
              <div className="text-2xl font-semibold">{formatTRY(unitPrice)}</div>
              {p.listPrice ? (
                <div className="text-xs text-slate-400 line-through">Liste {formatTRY(p.listPrice)}</div>
              ) : null}
            </div>
            <div className="text-right">
              <div className="text-xs uppercase tracking-wide text-slate-500">Toplam</div>
              <div className="text-2xl font-semibold">{formatTRY(lineTotal)}</div>
              <div className="text-xs text-slate-500">{qty} {p.unit}</div>
            </div>
          </div>
          {summary ? <p className="text-xs text-slate-600">{summary}</p> : null}
          <div className="text-xs text-slate-500">
            {p.available > 0 ? `Stokta ${p.available} ${p.unit}` : "Stok tükendi"}
            {p.leadTimeDays ? ` · ortalama ${p.leadTimeDays} gün üretim` : ""}
          </div>
          <button
            disabled={pending || p.available === 0}
            onClick={submit}
            className="w-full bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-medium py-3 rounded-full transition"
          >
            {pending ? "Sepete ekleniyor…" : "Sepete ekle"}
          </button>
          {feedback ? (
            <p className={`text-xs ${feedback.ok ? "text-emerald-700" : "text-red-600"}`}>{feedback.msg}</p>
          ) : null}
        </div>
      </div>

      {zoom && p.images.length > 0 ? (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setZoom(false)}>
          <div className="relative max-w-5xl w-full h-full">
            <Image src={p.images[imageIdx].url} alt={p.images[imageIdx].alt} fill className="object-contain" sizes="100vw" unoptimized />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Group({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <h3 className="text-base font-semibold">{title}</h3>
        {subtitle ? <span className="text-xs text-slate-500">{subtitle}</span> : null}
      </div>
      {children}
    </div>
  );
}
