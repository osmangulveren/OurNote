"use client";

import { AnimatePresence, motion } from "motion/react";
import { createElement, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createPortal } from "react-dom";

/** "View in your room": AR on phones (WebXR / Scene Viewer / Quick Look), an orbit viewer elsewhere. */
type MV = HTMLElement & {
  loaded: boolean;
  model?: { materials: { name: string; pbrMetallicRoughness: { setBaseColorFactor: (c: [number, number, number, number]) => void } }[] };
};

export default function ARViewer({ src, name, hex }: { src: string; name: string; hex?: string }) {
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const ref = useRef<MV>(null);

  // Apply the selected fabric to upholstery materials (our exported models name them "fabric").
  useEffect(() => {
    const mv = ref.current;
    if (!mv || !hex) return;
    const apply = () => {
      const c = new THREE.Color(hex); // linear, as glTF expects
      mv.model?.materials.filter((m) => /fabric/i.test(m.name)).forEach((m) => m.pbrMetallicRoughness.setBaseColorFactor([c.r, c.g, c.b, 1]));
    };
    if (mv.loaded) apply();
    mv.addEventListener("load", apply);
    return () => mv.removeEventListener("load", apply);
  }, [hex, ready, open]);
  useEffect(() => {
    if (!open || ready) return;
    import("@google/model-viewer").then(() => setReady(true));
  }, [open, ready]);

  const viewer = createElement(
    "model-viewer",
    {
      ref,
      src,
      alt: name,
      ar: "",
      "ar-modes": "webxr scene-viewer quick-look",
      "ar-scale": "fixed",
      "camera-controls": "",
      "auto-rotate": "",
      "shadow-intensity": "1",
      style: { width: "100%", height: "min(70vh, 560px)", background: "#faf8f3" },
    },
    <button slot="ar-button" className="btn-accent absolute bottom-5 left-1/2 -translate-x-1/2">Place it in my room</button>,
  );

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="chip">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden><path d="M12 3 4 7.5v9L12 21l8-4.5v-9zM4 7.5 12 12l8-4.5M12 12v9" strokeLinejoin="round" /></svg>
        View in your room
      </button>
      {typeof document !== "undefined" && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)}>
              <motion.div className="relative w-full max-w-3xl overflow-hidden rounded-[28px] bg-paper" initial={{ y: 30, scale: 0.97 }} animate={{ y: 0, scale: 1 }} exit={{ y: 30, scale: 0.97 }} onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between border-b border-line px-5 py-3">
                  <div>
                    <div className="font-display text-2xl leading-none">{name}</div>
                    <div className="font-mono text-[10px] uppercase tracking-wider text-stone">True to size · on a phone, tap the button to place it in a room</div>
                  </div>
                  <button onClick={() => setOpen(false)} className="grid h-9 w-9 place-items-center rounded-full ring-1 ring-line hover:bg-bone" aria-label="Close">✕</button>
                </div>
                {ready ? viewer : (
                  <div className="grid h-[min(70vh,560px)] place-items-center"><div className="h-6 w-6 animate-spin rounded-full border-2 border-ink/10 border-t-ink/50" /></div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
