"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Stage } from "@/components/three";
import { FABRIC_KIND_LABEL, FABRICS } from "@/lib/fabrics";
import type { Shape } from "@/lib/shape";

const PREVIEW: { label: string; shape: Shape }[] = [
  { label: "Cushion", shape: { type: "swatch", width: 55, depth: 55, height: 16 } },
  { label: "Chair", shape: { type: "armchair", width: 80, depth: 75, height: 78, armWidth: 16, seatHeight: 42, armHeight: 60, legs: "hidden", curved: true } },
  { label: "Pouf", shape: { type: "pouf", width: 45, depth: 45, height: 42 } },
];

export default function FabricExplorer({ canRequest, action }: { canRequest: boolean; action: (f: FormData) => Promise<void> }) {
  const [active, setActive] = useState(FABRICS[3]);
  const [preview, setPreview] = useState(0);
  const [kit, setKit] = useState<string[]>([]);
  const toggle = (n: string) => setKit((k) => (k.includes(n) ? k.filter((x) => x !== n) : [...k, n]));

  return (
    <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr]">
      <div className="relative overflow-hidden rounded-[28px] bg-paper ring-1 ring-line lg:sticky lg:top-24 lg:self-start">
        <Stage shape={PREVIEW[preview].shape} hex={active.hex} kind={active.kind} autoRotate className="h-[420px] sm:h-[540px]" />
        <div className="absolute left-4 top-4 flex gap-1.5">
          {PREVIEW.map((p, i) => (
            <button key={p.label} onClick={() => setPreview(i)} className={`chip ${i === preview ? "chip-active" : ""}`}>{p.label}</button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={active.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-5 left-5">
            <div className="font-display text-5xl leading-none">{active.name}</div>
            <div className="mt-1 font-mono text-[10.5px] uppercase tracking-wider text-stone">{FABRIC_KIND_LABEL[active.kind]}</div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div>
        {(["velvet", "boucle", "linen"] as const).map((kind) => (
          <section key={kind} className="mb-10">
            <div className="mb-4 flex items-baseline justify-between border-b border-line pb-2">
              <h3 className="font-display text-3xl capitalize">{kind === "boucle" ? "Bouclé" : kind === "linen" ? "Linen-look" : "Velvet"}</h3>
              <span className="font-mono text-[10px] uppercase tracking-wider text-stone">{FABRIC_KIND_LABEL[kind].split("·").slice(1).join("·")}</span>
            </div>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-4">
              {FABRICS.filter((f) => f.kind === kind).map((f) => (
                <div key={f.name} className="text-center">
                  <button
                    onClick={() => setActive(f)}
                    className={`relative mx-auto block aspect-square w-full max-w-[92px] rounded-full transition duration-500 hover:scale-105 ${active.name === f.name ? "ring-2 ring-ink ring-offset-4 ring-offset-bone" : ""}`}
                    style={{ background: f.hex, backgroundImage: kind === "boucle" ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,.35) 1.5px, transparent 2px)" : kind === "linen" ? "repeating-linear-gradient(90deg, rgba(0,0,0,.05) 0 1px, transparent 1px 3px)" : "radial-gradient(circle at 30% 25%, rgba(255,255,255,.28), transparent 60%)", backgroundSize: kind === "boucle" ? "7px 7px" : undefined }}
                    aria-label={f.name}
                  />
                  <div className="mt-2 text-xs text-ink-2">{f.name.split(" ")[0]}</div>
                  {canRequest && (
                    <label className="mt-1 inline-flex cursor-pointer items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-stone">
                      <input type="checkbox" checked={kit.includes(f.name)} onChange={() => toggle(f.name)} className="accent-ink" /> Kit
                    </label>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}

        {canRequest ? (
          <form action={action} className="panel p-6">
            {kit.map((k) => <input key={k} type="hidden" name="fabric" value={k} />)}
            <h3 className="font-display text-3xl">Free swatch kit</h3>
            <p className="mt-1 text-sm text-ink-3">A4 cuttings of the fabrics you tick, posted to your store — show customers the real thing.</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {kit.length === 0 ? <span className="text-sm text-stone">Tick “Kit” under the fabrics you want.</span> : kit.map((k) => <span key={k} className="chip">{k}</span>)}
            </div>
            <input name="note" placeholder="Anything else? (optional)" className="input mt-4" />
            <button className="btn-primary mt-4" disabled={kit.length === 0}>Send me {kit.length || ""} swatch{kit.length === 1 ? "" : "es"}</button>
          </form>
        ) : (
          <div className="panel p-6 text-sm text-ink-3">Store accounts can order a free swatch kit from this page.</div>
        )}
      </div>
    </div>
  );
}
