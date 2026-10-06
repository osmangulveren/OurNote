"use client";

import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { Stage } from "@/components/three";
import { fabricOf, FABRIC_KIND_LABEL } from "@/lib/fabrics";
import type { Shape } from "@/lib/shape";

type Props = {
  shape: Shape;
  colors: string[];
  className?: string;
  stageClassName?: string;
  autoRotate?: boolean;
  initialColor?: string;
  onColorChange?: (c: string) => void;
  compact?: boolean;
};

/** 3D product stage with fabric swatches, bed toggle and dimension overlay. */
export default function Configurator({ shape, colors, className = "", stageClassName = "h-[420px]", autoRotate = true, initialColor, onColorChange, compact }: Props) {
  const [color, setColor] = useState(initialColor ?? colors[0] ?? "Sand Velvet");
  const [open, setOpen] = useState(false);
  const [dims, setDims] = useState(false);
  const f = fabricOf(color);
  const canOpen = Boolean(shape.openDepth) && shape.type !== "corner";
  const pick = (c: string) => {
    setColor(c);
    onColorChange?.(c);
  };

  return (
    <div className={`relative ${className}`}>
      <Stage shape={shape} hex={f.hex} kind={f.kind} open={open} showDims={dims} autoRotate={autoRotate && !open} className={stageClassName} />

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <div className="pointer-events-auto flex gap-2">
          {canOpen && (
            <button onClick={() => setOpen((o) => !o)} className={`chip ${open ? "chip-active" : ""}`}>
              <BedIcon /> {open ? "Close sofa" : "Open as bed"}
            </button>
          )}
          <button onClick={() => setDims((d) => !d)} className={`chip ${dims ? "chip-active" : ""}`}>
            <RulerIcon /> Dimensions
          </button>
        </div>
        {!compact && <span className="eyebrow hidden pt-2 sm:block">Drag to rotate</span>}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="flex flex-wrap gap-1.5 rounded-full bg-paper/80 p-1.5 ring-1 ring-line backdrop-blur">
            {colors.map((c) => {
              const fc = fabricOf(c);
              return (
                <button
                  key={c}
                  onClick={() => pick(c)}
                  title={c}
                  aria-label={c}
                  className={`relative h-7 w-7 rounded-full transition-transform hover:scale-110 ${c === color ? "ring-2 ring-ink ring-offset-2 ring-offset-paper" : ""}`}
                  style={{ background: fc.hex, backgroundImage: fc.kind === "boucle" ? "radial-gradient(circle at 30% 30%, rgba(255,255,255,.35) 1px, transparent 1.5px)" : undefined, backgroundSize: "5px 5px" }}
                />
              );
            })}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={color}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3 }}
              className="rounded-2xl bg-paper/80 px-3.5 py-2 text-right ring-1 ring-line backdrop-blur"
            >
              <div className="text-sm font-medium">{color}</div>
              <div className="font-mono text-[10px] uppercase tracking-wider text-stone">{FABRIC_KIND_LABEL[f.kind]}</div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function BedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 18v-7h18v7M3 14h18M6 11V8h5v3" strokeLinejoin="round" />
    </svg>
  );
}
function RulerIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <path d="M3 17 17 3l4 4L7 21zM7 13l2 2M10 10l2 2M13 7l2 2" strokeLinejoin="round" />
    </svg>
  );
}
