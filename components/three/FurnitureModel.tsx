"use client";

import { RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { FabricKind } from "@/lib/fabrics";
import type { Shape } from "@/lib/shape";
import { channelPanel, quiltedCushion, softBox, tuftedPillow } from "./geometry";
import { useFabric, useStaticMaterials } from "./materials";

type Props = { shape: Shape; hex: string; kind: FabricKind; open?: boolean };

const cm = (v: number) => v / 100;
const damp = THREE.MathUtils.damp;

/** Procedural upholstered furniture built from a product's dimensions. Origin: floor centre, front = +z. */
export default function FurnitureModel({ shape, hex, kind, open = false }: Props) {
  const fabric = useFabric(hex, kind);
  const mats = useStaticMaterials();
  switch (shape.type) {
    case "bed":
      return <Bed s={shape} fabric={fabric} mats={mats} />;
    case "headboard":
      return <group position={[0, 0.45, 0]}><Channels w={cm(shape.width)} h={cm(shape.height)} t={0.08} fabric={fabric} /></group>;
    case "pouf":
      return <Pouf s={shape} fabric={fabric} />;
    case "bench":
      return <Bench s={shape} fabric={fabric} mats={mats} />;
    case "swatch":
      return (
        <group rotation={[0.35, 0.6, 0]} position={[0, 0.35, 0]}>
          <RoundedBox args={[0.55, 0.16, 0.55]} radius={0.075} smoothness={6} material={fabric} castShadow />
        </group>
      );
    default:
      if (shape.curved && shape.backCushions === 0) return <CurvedModular s={shape} fabric={fabric} mats={mats} />;
      return <Sofa s={shape} fabric={fabric} mats={mats} open={open} />;
  }
}

type Mats = ReturnType<typeof useStaticMaterials>;

function Legs({ s, positions, mats, h }: { s: Shape; positions: [number, number][]; mats: Mats; h: number }) {
  if (s.legs === "hidden") return null;
  const m = s.legs === "chrome" ? mats.chrome : s.legs === "wood" ? mats.wood : mats.black;
  return (
    <>
      {positions.map(([x, z], i) => (
        <mesh key={i} position={[x, h / 2, z]} material={s.legs === "chrome" ? mats.black : m} castShadow>
          {s.legs === "wood" ? <cylinderGeometry args={[0.018, 0.012, h, 16]} /> : <boxGeometry args={[0.045, h, 0.045]} />}
        </mesh>
      ))}
    </>
  );
}

/** Vertical channel tufting: a row of soft tubes. */
function Channels({ w, h, t, fabric, vertical = true }: { w: number; h: number; t: number; fabric: THREE.Material; vertical?: boolean }) {
  const n = Math.max(3, Math.round(w / 0.15));
  const cw = w / n;
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <RoundedBox
          key={i}
          args={vertical ? [cw - 0.004, h, t] : [t, h, cw - 0.004]}
          radius={Math.min(cw / 2 - 0.004, t / 2 - 0.002, 0.05)}
          smoothness={4}
          position={vertical ? [-w / 2 + cw * (i + 0.5), 0, 0] : [0, 0, -w / 2 + cw * (i + 0.5)]}
          material={fabric}
          castShadow
        />
      ))}
    </group>
  );
}

function Arm({ x, aw, ah, legH, depth, z = 0, s, fabric, outer }: {
  x: number; aw: number; ah: number; legH: number; depth: number; z?: number; s: Shape; fabric: THREE.Material; outer: 1 | -1;
}) {
  const h = ah - legH;
  const r = Math.min(aw * (s.curved ? 0.49 : 0.42), h / 2 - 0.01, 0.14);
  return (
    <group position={[x, legH + h / 2, z]}>
      <RoundedBox args={[aw, h, depth]} radius={r} smoothness={6} material={fabric} castShadow receiveShadow />
      {s.channels && (
        <group position={[outer * (aw / 2 - 0.008), -0.03, 0]}>
          <Channels w={depth - 0.06} h={h - 0.16} t={0.035} fabric={fabric} vertical={false} />
        </group>
      )}
    </group>
  );
}

function Sofa({ s, fabric, mats, open }: { s: Shape; fabric: THREE.Material; mats: Mats; open: boolean }) {
  const W = cm(s.width), D = cm(s.depth), H = cm(s.height);
  const aw = cm(s.armWidth ?? 22);
  const sh = cm(s.seatHeight ?? 45);
  const ah = cm(s.armHeight ?? Math.min(65, s.height - 18));
  const legH = s.legs === "hidden" ? 0.025 : 0.09;
  const innerW = W - 2 * aw;
  const armchair = s.type === "armchair";
  const backT = 0.17;
  const backTop = armchair ? H - 0.06 : Math.min(ah + 0.02, H - 0.2);
  const nBack = s.backCushions ?? (armchair ? 1 : 3);
  const nSeat = s.seatCushions ?? (armchair ? 1 : 3);
  const seatD = D - backT - 0.02;
  const seatZ = -D / 2 + backT + seatD / 2;
  const cushionT = 0.13;
  const backH = Math.max(0.2, H - sh - 0.01);

  const corner = s.type === "corner";
  const chaiseW = corner ? Math.min(0.95, innerW * 0.4) : 0;
  const chaiseD = corner ? cm(s.chaiseDepth ?? 160) : D;
  const ext = s.openDepth && !corner ? Math.max(0, cm(s.openDepth) - D) : 0;

  const moving = useRef<THREE.Group>(null);
  const filler = useRef<THREE.Mesh>(null);
  const backs = useRef<(THREE.Group | null)[]>([]);
  const t = useRef(0);

  useFrame((_, dt) => {
    if (!ext) return;
    t.current = damp(t.current, open ? 1 : 0, 3.2, dt);
    const k = t.current;
    if (moving.current) moving.current.position.z = ext * k;
    if (filler.current) {
      filler.current.scale.z = Math.max(0.0001, ext * k);
      filler.current.position.z = -D / 2 + backT + (ext * k) / 2;
      filler.current.visible = k > 0.01;
    }
    backs.current.forEach((g) => {
      if (!g) return;
      // Back cushions lie down on the bed as the seat slides out
      const kk = THREE.MathUtils.smoothstep(k, 0.25, 1);
      g.rotation.x = THREE.MathUtils.lerp(-0.2, -Math.PI / 2, kk);
      g.position.y = THREE.MathUtils.lerp(sh + backH / 2 - 0.02, sh + 0.1, kk);
      g.position.z = THREE.MathUtils.lerp(-D / 2 + backT + 0.09, -D / 2 + backT + backH / 2 + 0.03, kk);
    });
  });

  const quilt = s.quilt;
  const geo = useMemo(() => {
    if (!quilt && !s.tufted) return null;
    const bw = innerW / Math.max(1, nBack) + 0.015;
    return {
      seat: quilt ? quiltedCushion(innerW - 0.008, cushionT, seatD, quilt[0], quilt[1]) : null,
      bed: quilt && ext ? quiltedCushion(innerW - 0.02, cushionT - 0.01, 1, quilt[0], 1, 0.004) : null,
      pillow: s.tufted ? tuftedPillow(bw, backH, 0.2) : null,
    };
  }, [quilt, s.tufted, innerW, cushionT, seatD, ext, nBack, backH]);

  const seatCushions = geo?.seat ? (
    <mesh geometry={geo.seat} material={fabric} position={[0, sh - cushionT / 2, seatZ]} castShadow receiveShadow />
  ) : Array.from({ length: nSeat }, (_, i) => {
    const w = innerW / nSeat;
    return (
      <RoundedBox
        key={i}
        args={[w - 0.008, cushionT, seatD]}
        radius={0.045}
        smoothness={5}
        position={[-innerW / 2 + w * (i + 0.5), sh - cushionT / 2, seatZ]}
        material={fabric}
        castShadow
        receiveShadow
      />
    );
  });

  const legPos: [number, number][] = [
    [-W / 2 + aw / 2, D / 2 - 0.08], [W / 2 - aw / 2, D / 2 - 0.08],
    [-W / 2 + aw / 2, -D / 2 + 0.08], [W / 2 - aw / 2, -D / 2 + 0.08],
  ];
  if (corner) legPos.push([W / 2 - aw / 2, -D / 2 + chaiseD - 0.08]);

  return (
    <group position={[0, 0, corner ? -(chaiseD - D) / 2 : 0]}>
      {s.legs === "hidden" && (
        <mesh position={[0, legH / 2, 0]} material={mats.plinth}><boxGeometry args={[W - 0.06, legH, D - 0.08]} /></mesh>
      )}
      {s.armStyle !== "roll" && <Legs s={s} positions={legPos} mats={mats} h={legH} />}

      {/* Back frame */}
      <RoundedBox
        args={[innerW + 0.02, backTop - legH, backT]}
        radius={0.05}
        smoothness={5}
        position={[0, legH + (backTop - legH) / 2, -D / 2 + backT / 2]}
        material={fabric}
        castShadow
        receiveShadow
      />

      {/* Seat + base (slide out together on sofa beds) */}
      <group ref={moving}>
        <RoundedBox
          args={[innerW - 0.01, sh - cushionT - legH, seatD - 0.05]}
          radius={0.025}
          smoothness={3}
          position={[0, legH + (sh - cushionT - legH) / 2, seatZ - 0.025]}
          material={fabric}
          castShadow
          receiveShadow
        />
        {seatCushions}
        {ext > 0 && s.legs === "chrome" && (
          <>
            {[-innerW / 3, innerW / 3].map((x) => (
              <mesh key={x} position={[x, legH / 2, D / 2 - 0.12]} material={mats.chrome}>
                <cylinderGeometry args={[0.02, 0.02, legH, 20]} />
              </mesh>
            ))}
          </>
        )}
      </group>

      {/* Bed extension that appears behind the sliding seat */}
      {ext > 0 && (
        <mesh ref={filler} position={[0, sh - cushionT / 2, -D / 2 + backT]} material={fabric} visible={false} receiveShadow geometry={geo?.bed ?? undefined}>
          {!geo?.bed && <boxGeometry args={[innerW - 0.02, cushionT - 0.01, 1]} />}
        </mesh>
      )}

      {/* Chaise (corner sofas) */}
      {corner && (
        <group>
          <RoundedBox
            args={[chaiseW - 0.01, sh - cushionT - legH, chaiseD - D + 0.02]}
            radius={0.025}
            smoothness={3}
            position={[W / 2 - aw - chaiseW / 2, legH + (sh - cushionT - legH) / 2, D / 2 + (chaiseD - D) / 2 - 0.03]}
            material={fabric}
            castShadow
          />
          <RoundedBox
            args={[chaiseW - 0.008, cushionT, chaiseD - D + 0.02]}
            radius={0.045}
            smoothness={5}
            position={[W / 2 - aw - chaiseW / 2, sh - cushionT / 2, D / 2 + (chaiseD - D) / 2 - 0.02]}
            material={fabric}
            castShadow
            receiveShadow
          />
        </group>
      )}

      {/* Back cushions */}
      {Array.from({ length: nBack }, (_, i) => {
        const w = innerW / nBack;
        return (
          <group
            key={i}
            ref={(g) => { backs.current[i] = g; }}
            position={[-innerW / 2 + w * (i + 0.5), sh + backH / 2 - 0.02, -D / 2 + backT + 0.09]}
            rotation={[-0.2, 0, 0]}
          >
            {geo?.pillow ? (
              <>
                <mesh geometry={geo.pillow} material={fabric} castShadow />
                <mesh position={[0, 0, 0.068]} material={fabric}><sphereGeometry args={[0.013, 12, 12]} /></mesh>
              </>
            ) : (
              <>
                <RoundedBox args={[w + 0.015, backH, 0.2]} radius={0.09} smoothness={6} material={fabric} castShadow />
                {/* Button tufting */}
                {!armchair && (
                  <mesh position={[0, 0, 0.1]} material={fabric}><sphereGeometry args={[0.012, 12, 12]} /></mesh>
                )}
              </>
            )}
          </group>
        );
      })}

      {s.armStyle === "roll" ? (
        <>
          <RollArm x={-W / 2 + aw / 2} aw={aw} ah={ah} depth={D} s={s} fabric={fabric} mats={mats} outer={-1} />
          <RollArm x={W / 2 - aw / 2} aw={aw} ah={ah} depth={chaiseD} z={(chaiseD - D) / 2} s={s} fabric={fabric} mats={mats} outer={1} />
        </>
      ) : (
      <>
      <Arm x={-W / 2 + aw / 2} aw={aw} ah={ah} legH={legH} depth={D} s={s} fabric={fabric} outer={-1} />
      <Arm
        x={W / 2 - aw / 2}
        aw={aw}
        ah={ah}
        legH={legH}
        depth={chaiseD}
        z={(chaiseD - D) / 2}
        s={s}
        fabric={fabric}
        outer={1}
      />
      </>
      )}
    </group>
  );
}

/**
 * Arm with a padded roll cap that overhangs outwards, vertical channels on the outer
 * panel and small black feet — the Milano-style arm.
 */
function RollArm({ x, aw, ah, depth, z = 0, s, fabric, mats, outer }: {
  x: number; aw: number; ah: number; depth: number; z?: number; s: Shape; fabric: THREE.Material; mats: Mats; outer: 1 | -1;
}) {
  const feet = 0.03;
  const capH = 0.17;
  const bodyH = ah - feet - capH * 0.55;
  const g = useMemo(() => ({
    body: softBox(aw, bodyH, depth - 0.02, 0.04),
    cap: softBox(aw + 0.05, capH, depth + 0.012, 0.08),
    channels: s.channels ? channelPanel(depth - 0.1, bodyH - 0.06, 0.05, 6) : null,
  }), [aw, bodyH, depth, s.channels]);
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={g.body} material={fabric} position={[0, feet + bodyH / 2, 0]} castShadow receiveShadow />
      <mesh geometry={g.cap} material={fabric} position={[outer * 0.022, ah - capH / 2, 0.004]} castShadow receiveShadow />
      {g.channels && (
        <mesh geometry={g.channels} material={fabric} position={[outer * (aw / 2 - 0.012), feet + bodyH / 2 - 0.01, 0]} rotation={[0, (outer * Math.PI) / 2, 0]} castShadow />
      )}
      {[-1, 1].map((k) => (
        <mesh key={k} position={[0, feet / 2, k * (depth / 2 - 0.09)]} material={mats.black}>
          <cylinderGeometry args={[0.025, 0.025, feet, 16]} />
        </mesh>
      ))}
    </group>
  );
}

/** Rounded modules arranged on a gentle arc (e.g. curved bouclé sofas). */
function CurvedModular({ s, fabric, mats }: { s: Shape; fabric: THREE.Material; mats: Mats }) {
  const W = cm(s.width), D = cm(s.depth), H = cm(s.height);
  const aw = cm(s.armWidth ?? 24);
  const sh = cm(s.seatHeight ?? 42);
  const ah = cm(s.armHeight ?? 62);
  const n = s.seatCushions ?? 3;
  const modW = (W - 2 * aw) / n;
  const R = W * 1.1;
  const legH = 0.03;
  const backT = 0.26;
  const angle = (i: number) => (i - (n - 1) / 2) * (modW / R);
  const place = (i: number, localX = 0) => {
    const a = angle(i);
    return { pos: [Math.sin(a) * R + Math.cos(a) * localX, 0, R - Math.cos(a) * R + Math.sin(a) * localX] as const, rot: -a };
  };
  return (
    <group position={[0, 0, -0.25]}>
      {Array.from({ length: n }, (_, i) => {
        const { pos, rot } = place(i);
        return (
          <group key={i} position={[pos[0], 0, pos[2]]} rotation={[0, rot, 0]}>
            <mesh position={[0, legH / 2, 0]} material={mats.plinth}><boxGeometry args={[modW - 0.04, legH, D - 0.08]} /></mesh>
            <RoundedBox args={[modW - 0.006, sh - 0.14 - legH, D - 0.02]} radius={0.05} smoothness={4} position={[0, legH + (sh - 0.14 - legH) / 2, 0]} material={fabric} castShadow />
            <RoundedBox args={[modW - 0.01, 0.15, D - backT - 0.02]} radius={0.07} smoothness={6} position={[0, sh - 0.075, backT / 2]} material={fabric} castShadow receiveShadow />
            <RoundedBox args={[modW + 0.004, H - legH, backT]} radius={0.12} smoothness={8} position={[0, legH + (H - legH) / 2, -D / 2 + backT / 2]} material={fabric} castShadow />
          </group>
        );
      })}
      {[0, n - 1].map((i) => {
        const dir = i === 0 ? -1 : 1;
        const { pos, rot } = place(i, dir * (modW / 2 + aw / 2));
        return (
          <group key={i} position={[pos[0], 0, pos[2]]} rotation={[0, rot, 0]}>
            <RoundedBox args={[aw, ah - legH, D]} radius={Math.min(aw * 0.49, 0.14)} smoothness={8} position={[0, legH + (ah - legH) / 2, 0]} material={fabric} castShadow />
          </group>
        );
      })}
    </group>
  );
}

function Bed({ s, fabric, mats }: { s: Shape; fabric: THREE.Material; mats: Mats }) {
  const W = cm(s.width), D = cm(s.depth), H = cm(s.height);
  return (
    <group>
      <mesh position={[0, 0.0125, 0.05]} material={mats.plinth}><boxGeometry args={[W - 0.1, 0.025, D - 0.2]} /></mesh>
      <RoundedBox args={[W, 0.3, D - 0.1]} radius={0.04} smoothness={4} position={[0, 0.025 + 0.15, 0.05]} material={fabric} castShadow receiveShadow />
      <RoundedBox args={[W - 0.1, 0.22, D - 0.22]} radius={0.06} smoothness={5} position={[0, 0.325 + 0.11, 0.08]} material={mats.linen} castShadow receiveShadow />
      {[-1, 1].map((x) => (
        <RoundedBox key={x} args={[W / 2 - 0.14, 0.14, 0.42]} radius={0.065} smoothness={6} position={[x * (W / 4 - 0.02), 0.62, -D / 2 + 0.42]} rotation={[-0.25, 0, 0]} material={mats.linen} castShadow />
      ))}
      <RoundedBox args={[W - 0.04, 0.035, 0.55]} radius={0.015} smoothness={3} position={[0, 0.565, D / 2 - 0.42]} material={fabric} castShadow />
      <group position={[0, H / 2 + 0.01, -D / 2 + 0.05]}>
        <Channels w={W} h={H - 0.02} t={0.1} fabric={fabric} />
      </group>
    </group>
  );
}

function Pouf({ s, fabric }: { s: Shape; fabric: THREE.Material }) {
  const r = cm(s.width) / 2, h = cm(s.height);
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)];
    const e = 0.05;
    for (let i = 0; i <= 8; i++) {
      const a = -Math.PI / 2 + (i / 8) * (Math.PI / 2);
      pts.push(new THREE.Vector2(r - e + Math.cos(a) * e, e + Math.sin(a) * e));
    }
    for (let i = 0; i <= 10; i++) {
      const a = (i / 10) * (Math.PI / 2);
      pts.push(new THREE.Vector2(r - e * 1.6 + Math.cos(a) * e * 1.6, h - e * 1.6 + Math.sin(a) * e * 1.6));
    }
    pts.push(new THREE.Vector2(0, h - 0.012));
    return new THREE.LatheGeometry(pts, 64);
  }, [r, h]);
  return (
    <group>
      <mesh geometry={geo} material={fabric} castShadow receiveShadow />
      <mesh position={[0, h - 0.008, 0]} material={fabric}><sphereGeometry args={[0.018, 16, 16]} /></mesh>
    </group>
  );
}

function Bench({ s, fabric, mats }: { s: Shape; fabric: THREE.Material; mats: Mats }) {
  const W = cm(s.width), D = cm(s.depth), H = cm(s.height);
  const legH = s.legs === "hidden" ? 0.025 : 0.1;
  return (
    <group>
      {s.legs === "hidden" ? (
        <mesh position={[0, legH / 2, 0]} material={mats.plinth}><boxGeometry args={[W - 0.04, legH, D - 0.04]} /></mesh>
      ) : (
        <Legs s={s} mats={mats} h={legH} positions={[[-W / 2 + 0.05, D / 2 - 0.05], [W / 2 - 0.05, D / 2 - 0.05], [-W / 2 + 0.05, -D / 2 + 0.05], [W / 2 - 0.05, -D / 2 + 0.05]]} />
      )}
      <RoundedBox args={[W, H - legH - 0.08, D]} radius={0.03} smoothness={4} position={[0, legH + (H - legH - 0.08) / 2, 0]} material={fabric} castShadow receiveShadow />
      <RoundedBox args={[W + 0.01, 0.09, D + 0.01]} radius={0.04} smoothness={5} position={[0, H - 0.045, 0]} material={fabric} castShadow />
    </group>
  );
}

/** Overall bounding box in metres (for camera framing and dimension lines). */
export function modelBounds(s: Shape) {
  const W = cm(s.width);
  const D = s.type === "corner" ? cm(s.chaiseDepth ?? 160) : s.type === "headboard" ? 0.1 : cm(s.depth);
  const H = s.type === "headboard" ? cm(s.height) + 0.45 : cm(s.height);
  return { W, D, H };
}
