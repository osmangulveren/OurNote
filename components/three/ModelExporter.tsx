"use client";

import { ContactShadows, Environment, Lightformer, OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { useRef, useState } from "react";
import type * as THREE from "three";
import { GLTFExporter } from "three/examples/jsm/exporters/GLTFExporter.js";
import { fabricOf } from "@/lib/fabrics";
import type { Shape } from "@/lib/shape";
import FurnitureModel from "./FurnitureModel";

/** Admin tool: turns the procedural model into a GLB (for AR and as the product's stored model). */
export default function ModelExporter({ productId, shape, color, upload }: {
  productId: string;
  shape: Shape;
  color: string;
  upload: (f: FormData) => Promise<{ url?: string; error?: string }>;
}) {
  const group = useRef<THREE.Group>(null);
  const [state, setState] = useState<{ busy?: boolean; msg?: string; err?: string }>({});
  const f = fabricOf(color);

  async function exportGlb() {
    if (!group.current) return;
    setState({ busy: true });
    try {
      const data = (await new GLTFExporter().parseAsync(group.current, { binary: true })) as ArrayBuffer;
      const fd = new FormData();
      fd.set("id", productId);
      fd.set("file", new File([data], "model.glb", { type: "model/gltf-binary" }));
      const res = await upload(fd);
      setState(res.error ? { err: res.error } : { msg: `Saved ${(data.byteLength / 1024).toFixed(0)} KB → ${res.url}` });
    } catch (e) {
      setState({ err: e instanceof Error ? e.message : "Export failed" });
    }
  }

  return (
    <div className="card overflow-hidden">
      <div className="h-64 bg-paper">
        <Canvas shadows camera={{ position: [2.6, 1.6, 3.2], fov: 30 }}>
          <Environment resolution={128} frames={1}>
            <Lightformer form="rect" intensity={2} position={[0, 4, 3]} scale={[8, 3, 1]} />
          </Environment>
          <directionalLight position={[3, 5, 3]} intensity={1.2} castShadow />
          <group ref={group}>
            <FurnitureModel shape={shape} hex={f.hex} kind={f.kind} />
          </group>
          <ContactShadows opacity={0.4} blur={2.4} far={2} />
          <OrbitControls target={[0, 0.35, 0]} />
        </Canvas>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4">
        <div className="text-sm">
          <b className="font-medium">Built-in model → GLB</b>
          <div className="muted">Saves this model as the product&apos;s GLB (used for “View in your room”).</div>
          {state.msg && <div className="mt-1 text-sm text-moss">{state.msg}</div>}
          {state.err && <div className="mt-1 text-sm text-clay-2">{state.err}</div>}
        </div>
        <button type="button" onClick={exportGlb} disabled={state.busy} className="btn-primary">
          {state.busy ? "Exporting…" : "Generate GLB"}
        </button>
      </div>
    </div>
  );
}
