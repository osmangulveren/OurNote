"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";
import type { FabricKind } from "@/lib/fabrics";

const textures: Partial<Record<FabricKind, THREE.Texture>> = {};

/** Procedural bump map: loops for bouclé, a fine weave for linen, soft pile noise for velvet. */
function bumpTexture(kind: FabricKind) {
  if (textures[kind]) return textures[kind]!;
  const size = 256;
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = "#808080";
  g.fillRect(0, 0, size, size);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  if (kind === "boucle") {
    for (let i = 0; i < 2200; i++) {
      const x = rnd() * size, y = rnd() * size, r = 1.5 + rnd() * 3.5;
      g.strokeStyle = `rgba(255,255,255,${0.35 + rnd() * 0.5})`;
      g.lineWidth = 1 + rnd() * 1.2;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.stroke();
    }
  } else if (kind === "linen") {
    for (let y = 0; y < size; y += 2) {
      g.fillStyle = `rgba(255,255,255,${0.15 + rnd() * 0.25})`;
      g.fillRect(0, y, size, 1);
    }
    for (let x = 0; x < size; x += 2) {
      g.fillStyle = `rgba(0,0,0,${0.08 + rnd() * 0.2})`;
      g.fillRect(x, 0, 1, size);
    }
  } else {
    const img = g.getImageData(0, 0, size, size);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 118 + rnd() * 20;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    }
    g.putImageData(img, 0, 0);
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(kind === "boucle" ? 5 : kind === "linen" ? 14 : 3, kind === "boucle" ? 5 : kind === "linen" ? 14 : 3);
  textures[kind] = t;
  return t;
}

/** Upholstery material that eases towards the target colour, so fabric swaps morph instead of snapping. */
export function useFabric(hex: string, kind: FabricKind) {
  const mat = useMemo(() => {
    const m = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(hex),
      roughness: kind === "velvet" ? 0.78 : 0.95,
      sheen: kind === "velvet" ? 1 : kind === "boucle" ? 0.45 : 0.25,
      sheenRoughness: kind === "velvet" ? 0.32 : 0.6,
      bumpMap: bumpTexture(kind),
      bumpScale: kind === "boucle" ? 2.2 : kind === "linen" ? 0.6 : 0.25,
    });
    m.sheenColor = new THREE.Color(hex).lerp(new THREE.Color("#ffffff"), 0.35);
    return m;
    // the material is rebuilt only when the fabric family changes; colour animates below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  const target = useMemo(() => new THREE.Color(hex), [hex]);
  const sheenTarget = useMemo(() => new THREE.Color(hex).lerp(new THREE.Color("#ffffff"), 0.35), [hex]);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 6);
    mat.color.lerp(target, k);
    mat.sheenColor.lerp(sheenTarget, k);
  });
  return mat;
}

export function useStaticMaterials() {
  return useMemo(
    () => ({
      chrome: new THREE.MeshStandardMaterial({ color: "#e8e8e8", metalness: 1, roughness: 0.18 }),
      wood: new THREE.MeshStandardMaterial({ color: "#6e4b30", roughness: 0.55 }),
      black: new THREE.MeshStandardMaterial({ color: "#1c1b18", roughness: 0.6 }),
      linen: new THREE.MeshPhysicalMaterial({ color: "#efebe3", roughness: 0.95, sheen: 0.3 }),
      plinth: new THREE.MeshStandardMaterial({ color: "#2a2824", roughness: 0.8 }),
    }),
    [],
  );
}
