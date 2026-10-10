"use client";

import { ContactShadows, Environment, Html, Lightformer, Line, OrbitControls, PerspectiveCamera, View } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import type { FabricKind } from "@/lib/fabrics";
import type { Shape } from "@/lib/shape";
import FurnitureModel, { modelBounds } from "./FurnitureModel";
import GLBModel from "./GLBModel";

/** The product's GLB when it has one (falls back to the procedural model while loading or when opened as a bed). */
function ProductModel({ shape, hex, kind, open, modelUrl }: { shape: Shape; hex: string; kind: FabricKind; open?: boolean; modelUrl?: string }) {
  const procedural = <FurnitureModel shape={shape} hex={hex} kind={kind} open={open} />;
  if (!modelUrl || open) return procedural;
  return (
    <Suspense fallback={procedural}>
      <GLBModel url={modelUrl} shape={shape} hex={hex} />
    </Suspense>
  );
}

export type StageProps = {
  shape: Shape;
  hex: string;
  kind: FabricKind;
  open?: boolean;
  showDims?: boolean;
  autoRotate?: boolean;
  controls?: boolean;
  className?: string;
  modelUrl?: string;
};

/** Soft studio light built from light-formers, so no HDR file has to be downloaded. */
function Studio() {
  return (
    <Environment resolution={256} frames={1}>
      <Lightformer form="rect" intensity={2.2} position={[0, 4, 3]} scale={[8, 3, 1]} color="#fff6ea" />
      <Lightformer form="rect" intensity={1.1} position={[-5, 2, -1]} rotation-y={Math.PI / 2} scale={[6, 3, 1]} color="#f2e6d6" />
      <Lightformer form="rect" intensity={0.8} position={[5, 1.5, 1]} rotation-y={-Math.PI / 2} scale={[6, 2, 1]} color="#ffffff" />
      <Lightformer form="circle" intensity={0.6} position={[0, -2, 2]} scale={4} color="#d8c8ae" />
    </Environment>
  );
}

function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight
        position={[2.5, 4.5, 3]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-camera-left={-3}
        shadow-camera-right={3}
        shadow-camera-top={3}
        shadow-camera-bottom={-3}
      />
    </>
  );
}

function Dimensions({ shape, open }: { shape: Shape; open?: boolean }) {
  const { W, D: D0, H } = modelBounds(shape);
  const D = open && shape.openDepth ? shape.openDepth / 100 : D0;
  const zFront = shape.type === "corner" ? D0 / 2 : D0 / 2 + (D - D0);
  const zBack = shape.type === "corner" ? -D0 / 2 : -D0 / 2;
  const c = "#8a857b";
  const tick = 0.05;
  const label = (text: string) => (
    <div className="pointer-events-none whitespace-nowrap rounded-full bg-bone/90 px-2 py-0.5 font-mono text-[10px] tracking-wider text-ink-2 ring-1 ring-line">
      {text}
    </div>
  );
  const yW = 0.004;
  const zW = zFront + 0.18;
  const xD = W / 2 + 0.18;
  const xH = -W / 2 - 0.16;
  return (
    <group>
      <Line points={[[-W / 2, yW, zW], [W / 2, yW, zW]]} color={c} lineWidth={1} />
      <Line points={[[-W / 2, yW, zW - tick], [-W / 2, yW, zW + tick]]} color={c} lineWidth={1} />
      <Line points={[[W / 2, yW, zW - tick], [W / 2, yW, zW + tick]]} color={c} lineWidth={1} />
      <Html position={[0, yW, zW]} center>{label(`${shape.width} cm`)}</Html>

      <Line points={[[xD, yW, zBack], [xD, yW, zFront]]} color={c} lineWidth={1} />
      <Line points={[[xD - tick, yW, zBack], [xD + tick, yW, zBack]]} color={c} lineWidth={1} />
      <Line points={[[xD - tick, yW, zFront], [xD + tick, yW, zFront]]} color={c} lineWidth={1} />
      <Html position={[xD, yW, (zBack + zFront) / 2]} center>
        {label(`${open && shape.openDepth ? shape.openDepth : shape.type === "corner" ? shape.chaiseDepth : shape.depth} cm${open ? " open" : ""}`)}
      </Html>

      <Line points={[[xH, 0, zBack + 0.05], [xH, H, zBack + 0.05]]} color={c} lineWidth={1} />
      <Line points={[[xH - tick, H, zBack + 0.05], [xH + tick, H, zBack + 0.05]]} color={c} lineWidth={1} />
      <Html position={[xH, H / 2, zBack + 0.05]} center>{label(`${shape.height} cm`)}</Html>
    </group>
  );
}

/** Slow swing around the front three-quarter view — a sofa should never idle showing its back. */
function Turntable({ enabled, children }: { enabled: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!ref.current) return;
    if (enabled) t.current += dt;
    const target = enabled ? Math.sin(t.current * 0.32) * 0.5 - 0.1 : ref.current.rotation.y;
    ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, target, 3, dt);
  });
  return <group ref={ref}>{children}</group>;
}

function cameraFor(shape: Shape) {
  if (shape.type === "swatch") return { position: [1.05, 0.95, 1.35] as [number, number, number], target: [0, 0.33, 0] as [number, number, number] };
  const { W, D, H } = modelBounds(shape);
  const size = Math.max(W, D * 0.9, H * 1.4);
  const dist = size * 1.75 + 0.6;
  return { position: [dist * 0.62, dist * 0.42 + H * 0.2, dist * 0.82] as [number, number, number], target: [0, H * 0.4, 0] as [number, number, number] };
}

/** Full interactive stage (hero, product configurator, fabric viewer). */
export default function Stage({ shape, hex, kind, open, showDims, autoRotate = false, controls = true, className, modelUrl }: StageProps) {
  const cam = cameraFor(shape);
  const [interacting, setInteracting] = useState(false);
  return (
    <div className={className}>
      <Canvas shadows dpr={[1, 2]} gl={{ antialias: true }} camera={{ position: cam.position, fov: 30 }}>
        <Suspense fallback={null}>
          <Studio />
          <Lights />
          <Turntable enabled={autoRotate && !interacting}>
            <ProductModel shape={shape} hex={hex} kind={kind} open={open} modelUrl={modelUrl} />
            {showDims && <Dimensions shape={shape} open={open} />}
          </Turntable>
          <ContactShadows position={[0, 0.001, 0]} opacity={0.5} scale={10} blur={2.6} far={2.5} resolution={512} color="#3a2f22" />
          {controls && (
            <OrbitControls
              target={cam.target}
              enablePan={false}
              enableZoom
              minDistance={1.2}
              maxDistance={9}
              minPolarAngle={0.35}
              maxPolarAngle={Math.PI / 2.05}
              enableDamping
              onStart={() => setInteracting(true)}
              onEnd={() => setTimeout(() => setInteracting(false), 2500)}
            />
          )}
          {!controls && <CameraTarget target={cam.target} />}
        </Suspense>
      </Canvas>
    </div>
  );
}

function CameraTarget({ target }: { target: [number, number, number] }) {
  useFrame(({ camera }) => camera.lookAt(...target));
  return null;
}

/* ------------------------------------------------------------------ */
/* Many small 3D thumbnails sharing a single WebGL canvas (drei View). */

export function ViewsCanvas() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => setEl(document.body), []);
  if (!el) return null;
  return (
    <Canvas
      eventSource={el}
      className="!pointer-events-none !fixed !inset-0 z-[1]"
      dpr={[1, 1.75]}
      shadows={false}
      gl={{ antialias: true, alpha: true }}
    >
      <View.Port />
    </Canvas>
  );
}

/** A slowly turning product model rendered into the shared canvas at this element's position. */
/** Frames the model for this view's aspect ratio (portrait tiles need more distance). */
function ThumbCamera({ shape }: { shape: Shape }) {
  const size = useThree((s) => s.size);
  const cam = cameraFor(shape);
  const aspect = size.width / Math.max(1, size.height);
  const k = Math.max(0.92, 1.45 / aspect);
  return (
    <>
      <PerspectiveCamera makeDefault position={cam.position.map((v) => v * k) as [number, number, number]} fov={30} />
      <CameraTarget target={cam.target} />
    </>
  );
}

export function ModelThumb({ shape, hex, kind, active = false, className, modelUrl }: { shape: Shape; hex: string; kind: FabricKind; active?: boolean; className?: string; modelUrl?: string }) {
  return (
    <View className={className}>
      <ThumbCamera shape={shape} />
      <ambientLight intensity={0.6} />
      <hemisphereLight args={["#fff8ee", "#b9a88f", 1.1]} />
      <directionalLight position={[3, 5, 4]} intensity={1.6} />
      <directionalLight position={[-4, 2, -2]} intensity={0.4} />
      <ThumbSpin active={active}>
        <ProductModel shape={shape} hex={hex} kind={kind} modelUrl={modelUrl} />
      </ThumbSpin>
    </View>
  );
}

function ThumbSpin({ active, children }: { active: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const speed = useRef(0);
  const phase = useRef(Math.random() * 10);
  useFrame((_, dt) => {
    if (!ref.current) return;
    // idle: gentle swing; hovered: a full turn so buyers see the back and sides
    speed.current = THREE.MathUtils.damp(speed.current, active ? 1.1 : 0, 4, dt);
    phase.current += dt;
    ref.current.rotation.y += dt * speed.current;
    if (!active) {
      const rest = Math.round(ref.current.rotation.y / (Math.PI * 2)) * Math.PI * 2 - 0.5 + Math.sin(phase.current * 0.5) * 0.25;
      ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, rest, 2, dt);
    }
  });
  return <group ref={ref} rotation={[0, -0.5, 0]}>{children}</group>;
}
