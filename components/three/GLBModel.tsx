"use client";

import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import type { Shape } from "@/lib/shape";

type TintUniforms = {
  uTint: { value: THREE.Color };
  uRefLum: { value: number };
  uRefChroma: { value: THREE.Vector3 };
  uTintAmount: { value: number };
};

/** Average linear colour of a texture's mid-tones — for a sofa scan that's the upholstery. */
function dominantColor(tex: THREE.Texture) {
  const img = tex.image as CanvasImageSource & { width: number; height: number };
  const fallback = { lum: 0.4, chroma: new THREE.Vector3(1, 1, 1) };
  if (!img || !img.width) return fallback;
  const c = document.createElement("canvas");
  c.width = c.height = 64;
  const g = c.getContext("2d", { willReadFrequently: true });
  if (!g) return fallback;
  try {
    g.drawImage(img, 0, 0, 64, 64);
  } catch {
    return fallback;
  }
  const px = g.getImageData(0, 0, 64, 64).data;
  const acc = new THREE.Vector3();
  let n = 0;
  const col = new THREE.Color();
  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] < 128) continue;
    col.setRGB(px[i] / 255, px[i + 1] / 255, px[i + 2] / 255, THREE.SRGBColorSpace); // → linear
    const lum = 0.2126 * col.r + 0.7152 * col.g + 0.0722 * col.b;
    if (lum < 0.03 || lum > 0.85) continue; // skip shadows, black feet and chrome highlights
    acc.x += col.r; acc.y += col.g; acc.z += col.b;
    n++;
  }
  if (!n) return fallback;
  acc.divideScalar(n);
  const lum = 0.2126 * acc.x + 0.7152 * acc.y + 0.0722 * acc.z;
  return { lum, chroma: acc.clone().divideScalar(Math.max(lum, 1e-4)) };
}

/**
 * Replaces the colour of upholstery pixels with the chosen fabric while keeping the scan's
 * shading, seams and creases. Pixels whose hue is far from the dominant fabric hue
 * (chrome legs, black feet, wood) are left untouched.
 */
function makeTintable(mat: THREE.MeshStandardMaterial, uniforms: TintUniforms) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
uniform vec3 uTint; uniform float uRefLum; uniform vec3 uRefChroma; uniform float uTintAmount;`,
      )
      .replace(
        "#include <map_fragment>",
        `#ifdef USE_MAP
  vec4 sampledDiffuseColor = texture2D( map, vMapUv );
  float lum = dot( sampledDiffuseColor.rgb, vec3( 0.2126, 0.7152, 0.0722 ) );
  vec3 chroma = sampledDiffuseColor.rgb / max( lum, 1e-4 );
  float isFabric = ( 1.0 - smoothstep( 0.18, 0.45, distance( chroma, uRefChroma ) ) ) * smoothstep( 0.02, 0.07, lum );
  vec3 tinted = uTint * clamp( lum / uRefLum, 0.0, 2.5 );
  diffuseColor.rgb *= mix( sampledDiffuseColor.rgb, tinted, isFabric * uTintAmount );
  diffuseColor.a *= sampledDiffuseColor.a;
#endif`,
      );
  };
  mat.customProgramCacheKey = () => "tintable-v1";
  mat.needsUpdate = true;
}

/**
 * A product GLB (photo-to-3D scan or exported model) placed on the floor, centred,
 * scaled to the product's real width and recoloured with the selected fabric.
 */
export default function GLBModel({ url, shape, hex }: { url: string; shape: Shape; hex: string }) {
  const gltf = useGLTF(url);
  const tint = shape.modelTint !== false;

  const { root, fabricMats, uniforms } = useMemo(() => {
    const root = gltf.scene.clone(true);
    root.rotation.y = THREE.MathUtils.degToRad(shape.modelRotationY ?? 0);
    root.updateMatrixWorld(true);
    // scale to the real width, then sit on the floor at the origin
    const box = new THREE.Box3().setFromObject(root);
    const size = box.getSize(new THREE.Vector3());
    const k = size.x > 0 ? shape.width / 100 / size.x : 1;
    root.scale.setScalar(k);
    root.updateMatrixWorld(true);
    box.setFromObject(root);
    const center = box.getCenter(new THREE.Vector3());
    root.position.set(-center.x, -box.min.y, -center.z);

    const uniforms: TintUniforms = {
      uTint: { value: new THREE.Color(hex) },
      uRefLum: { value: 0.4 },
      uRefChroma: { value: new THREE.Vector3(1, 1, 1) },
      uTintAmount: { value: tint ? 1 : 0 },
    };
    const fabricMats: THREE.MeshStandardMaterial[] = [];
    let sampled = false;
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      const mats = (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).map((m) => {
        const mm = (m as THREE.MeshStandardMaterial).clone();
        if (!tint) return mm;
        if (/fabric/i.test(mm.name)) {
          fabricMats.push(mm); // our own exports: plain upholstery material
        } else if (mm.map) {
          if (!sampled) {
            const d = dominantColor(mm.map);
            uniforms.uRefLum.value = d.lum;
            uniforms.uRefChroma.value.copy(d.chroma);
            sampled = true;
          }
          makeTintable(mm, uniforms);
        }
        return mm;
      });
      mesh.material = Array.isArray(mesh.material) ? mats : mats[0];
    });
    return { root, fabricMats, uniforms };
    // the clone is rebuilt only when the model or its placement changes; colour animates below
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gltf.scene, shape.width, shape.modelRotationY, tint]);

  const target = useMemo(() => new THREE.Color(hex), [hex]);
  useFrame((_, dt) => {
    const k = 1 - Math.exp(-dt * 6);
    uniforms.uTint.value.lerp(target, k);
    fabricMats.forEach((m) => m.color.lerp(target, k));
  });

  useEffect(() => () => {
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach((m) => m.dispose());
    });
  }, [root]);

  return <primitive object={root} />;
}
