"use client";

import { ContactShadows, Edges, OrbitControls, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { planLoad, TRAILER, type PlanItem, type Placed } from "@/lib/loadplan";

function Crate({ p, delay }: { p: Placed; delay: number }) {
  const ref = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  useFrame(({ clock }) => {
    if (!ref.current) return;
    if (t0.current === null) t0.current = clock.elapsedTime;
    const t = Math.max(0, clock.elapsedTime - t0.current - delay);
    const k = 1 - Math.pow(1 - Math.min(1, t / 0.7), 3);
    ref.current.position.y = p.y + (1 - k) * 3.2;
    ref.current.visible = t > 0;
  });
  const color = p.overflow ? "#c4553a" : p.color;
  return (
    <group ref={ref} position={[p.x - TRAILER.length / 2, p.y + 3.2, p.z - TRAILER.width / 2]} visible={false}>
      <RoundedBox args={[p.sx - 0.03, p.sy - 0.03, p.sz - 0.03]} radius={0.02} smoothness={2} castShadow>
        <meshStandardMaterial color={color} roughness={0.85} transparent={!p.mine} opacity={p.mine ? 1 : 0.55} />
      </RoundedBox>
      {p.mine && (
        // packing tape
        <mesh position={[0, p.sy / 2 - 0.012, 0]}>
          <boxGeometry args={[p.sx - 0.02, 0.006, 0.06]} />
          <meshStandardMaterial color="#e8dcc6" roughness={0.5} />
        </mesh>
      )}
    </group>
  );
}

function Trailer() {
  const { length: L, width: W, height: H } = TRAILER;
  return (
    <group>
      {/* floor */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[L + 0.1, 0.12, W + 0.1]} />
        <meshStandardMaterial color="#3a3833" roughness={0.9} />
      </mesh>
      {/* frame outline */}
      <mesh position={[0, H / 2, 0]}>
        <boxGeometry args={[L, H, W]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        <Edges color="#5c5850" />
      </mesh>
      {/* front wall + cab */}
      <mesh position={[-L / 2 - 0.02, H / 2, 0]}>
        <boxGeometry args={[0.04, H, W]} />
        <meshStandardMaterial color="#ddd6c9" transparent opacity={0.6} />
      </mesh>
      <RoundedBox args={[1.9, 2.9, 2.45]} radius={0.12} smoothness={4} position={[-L / 2 - 1.25, 1.35, 0]} castShadow>
        <meshStandardMaterial color="#b5532f" roughness={0.5} />
      </RoundedBox>
      <mesh position={[-L / 2 - 2.21, 1.9, 0]}>
        <boxGeometry args={[0.02, 0.9, 2.1]} />
        <meshStandardMaterial color="#1c1b18" roughness={0.2} metalness={0.3} />
      </mesh>
      {/* wheels */}
      {[-L / 2 - 1.4, L / 2 - 1.2, L / 2 - 2.3, L / 2 - 3.4].map((x) =>
        [-1, 1].map((s) => (
          <mesh key={`${x}${s}`} position={[x, -0.32, s * 1.05]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.45, 0.45, 0.3, 24]} />
            <meshStandardMaterial color="#1c1b18" roughness={0.8} />
          </mesh>
        )),
      )}
    </group>
  );
}

export default function TrailerStage({ items, className }: { items: PlanItem[]; className?: string }) {
  const plan = useMemo(() => planLoad(items), [items]);
  const sig = items.map((i) => `${i.key}:${i.qty}`).join("|");
  let mineIndex = 0;
  return (
    <div className={`relative ${className ?? ""}`}>
      {plan.overflow && (
        <div className="absolute right-4 top-4 z-[2] max-w-[260px] rounded-2xl bg-paper/90 px-3.5 py-2 text-xs text-ink-2 ring-1 ring-line backdrop-blur">
          <b className="font-medium text-clay-2">Tight load.</b> Red boxes don&apos;t fit our quick plan — we&apos;ll confirm the final loading plan before departure.
        </div>
      )}
      <Canvas shadows dpr={[1, 2]} camera={{ position: [9, 7.5, 12], fov: 32 }}>
        <ambientLight intensity={0.55} />
        <hemisphereLight args={["#fff8ee", "#9b8f7c", 0.8]} />
        <directionalLight position={[6, 10, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-9} shadow-camera-right={9} shadow-camera-top={9} shadow-camera-bottom={-9} />
        <group position={[0.8, 0.8, 0]} key={sig}>
          <Trailer />
          {plan.placed.map((p, i) => (
            <Crate key={i} p={p} delay={p.mine ? 0.35 + mineIndex++ * 0.06 : i * 0.015} />
          ))}
        </group>
        <ContactShadows position={[0, 0, 0]} opacity={0.35} scale={30} blur={2.5} far={3} />
        <OrbitControls target={[0, 1.2, 0]} enablePan={false} minDistance={8} maxDistance={26} maxPolarAngle={Math.PI / 2.1} enableDamping />
      </Canvas>
    </div>
  );
}
