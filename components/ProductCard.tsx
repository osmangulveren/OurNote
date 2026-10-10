"use client";

import Link from "next/link";
import { useState } from "react";
import { ModelThumb } from "@/components/three";
import { fabricOf } from "@/lib/fabrics";
import type { CardProduct } from "@/lib/views";

const eur = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

export default function ProductCard({ p, index = 0 }: { p: CardProduct; index?: number }) {
  const [hover, setHover] = useState(false);
  const [color, setColor] = useState(p.colors[0] ?? "Sand Velvet");
  const f = fabricOf(color);
  const markup = p.price && p.rrp ? p.rrp / 1.2 / p.price : null; // RRP incl. ~20% VAT

  return (
    <div
      className="group relative flex flex-col"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <Link href={`/products/${p.slug}`} className="relative block aspect-[5/4] overflow-hidden rounded-[22px] bg-paper ring-1 ring-line transition duration-500 group-hover:ring-ink/25">
        <div className="bg-grid absolute inset-0 opacity-60" />
        <div className="absolute left-4 top-4 z-[2] flex flex-wrap gap-1.5">
          {p.tags.slice(0, 2).map((t) => (
            <span key={t} className="badge bg-bone/90 text-ink-2 ring-1 ring-line">{t}</span>
          ))}
        </div>
        <span className="absolute right-4 top-4 z-[2] font-mono text-[10px] tracking-wider text-stone">{String(index + 1).padStart(2, "0")}</span>
        <ModelThumb shape={p.shape} hex={f.hex} kind={f.kind} active={hover} className="absolute inset-0" modelUrl={p.modelUrl || undefined} />
        <span className="absolute bottom-3 left-4 z-[2] font-mono text-[10px] uppercase tracking-wider text-stone">
          {p.shape.width}×{p.shape.type === "corner" ? p.shape.chaiseDepth : p.shape.depth}×{p.shape.height} cm
        </span>
      </Link>

      <div className="flex items-start justify-between gap-4 px-1 pt-4">
        <div className="min-w-0">
          <Link href={`/products/${p.slug}`} className="font-display text-[26px] leading-none tracking-tight">{p.name}</Link>
          <p className="mt-1.5 line-clamp-1 text-sm text-ink-3">{p.shortDescription}</p>
        </div>
        <div className="shrink-0 text-right">
          {p.price !== null ? (
            <>
              <div className="num text-lg">{eur(p.price)}</div>
              {markup && <div className="font-mono text-[10px] uppercase tracking-wider text-moss">{markup.toFixed(1)}× retail</div>}
            </>
          ) : (
            <div className="font-mono text-[10px] uppercase tracking-wider text-stone">Trade price<br />on login</div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between px-1 pt-3">
        <div className="flex -space-x-1">
          {p.colors.slice(0, 7).map((c) => (
            <button
              key={c}
              onMouseEnter={() => setColor(c)}
              onFocus={() => setColor(c)}
              aria-label={c}
              title={c}
              className={`h-4 w-4 rounded-full ring-2 ring-bone transition-transform hover:z-10 hover:scale-125 ${c === color ? "z-10 scale-125" : ""}`}
              style={{ background: fabricOf(c).hex }}
            />
          ))}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-stone">
          MOQ {p.moq} · {p.leadTimeDays}d
        </div>
      </div>
    </div>
  );
}
