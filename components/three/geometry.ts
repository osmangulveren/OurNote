import * as THREE from "three";
import { mergeVertices } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Upholstery geometry: a subdivided box whose surface is projected onto a rounded box,
 * with an optional displacement along the surface normal (seams, puff, tufting).
 * Vertices are welded so normals stay smooth across the rounded edges.
 */
export function softBox(
  w: number,
  h: number,
  d: number,
  r: number,
  displace?: (p: THREE.Vector3, n: THREE.Vector3) => number,
  density = 48,
) {
  const sx = Math.max(4, Math.round(density * w)), sy = Math.max(4, Math.round(density * h)), sz = Math.max(4, Math.round(density * d));
  const box = new THREE.BoxGeometry(w, h, d, sx, sy, sz);
  box.deleteAttribute("normal");
  box.deleteAttribute("uv");
  const g = mergeVertices(box, 1e-6);
  const pos = g.attributes.position as THREE.BufferAttribute;
  const hx = w / 2 - r, hy = h / 2 - r, hz = d / 2 - r;
  const p = new THREE.Vector3(), c = new THREE.Vector3(), n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    p.fromBufferAttribute(pos, i);
    c.set(THREE.MathUtils.clamp(p.x, -hx, hx), THREE.MathUtils.clamp(p.y, -hy, hy), THREE.MathUtils.clamp(p.z, -hz, hz));
    n.subVectors(p, c);
    if (n.lengthSq() < 1e-12) n.set(0, 1, 0);
    n.normalize();
    p.copy(c).addScaledVector(n, r);
    if (displace) p.addScaledVector(n, displace(p, n));
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  g.computeVertexNormals();
  return g;
}

const groove = (dist: number, width: number, depth: number) => -depth * Math.exp(-((dist / width) ** 2));

/** Seat/mattress block with a cols × rows quilted top and slightly domed squares. */
export function quiltedCushion(w: number, h: number, d: number, cols: number, rows: number, r = 0.04) {
  return softBox(w, h, d, r, (p, n) => {
    if (n.y < 0.5) return 0;
    const fx = ((p.x + w / 2) / w) * cols, fz = ((p.z + d / 2) / d) * rows;
    const dx = Math.abs(fx - Math.round(fx)) * (w / cols);
    const dz = Math.abs(fz - Math.round(fz)) * (d / rows);
    const inner = (x: number, n2: number) => Math.round(x) > 0 && Math.round(x) < n2;
    let off = 0;
    if (inner(fx, cols)) off += groove(dx, 0.012, 0.016);
    if (inner(fz, rows)) off += groove(dz, 0.012, 0.016);
    // gentle dome inside each square
    off += 0.008 * Math.sin(Math.PI * (fx % 1)) * Math.sin(Math.PI * (fz % 1));
    return off * n.y;
  });
}

/** Loose back pillow: puffed belly, a centre button dimple and four creases to the edge midpoints. */
export function tuftedPillow(w: number, h: number, t: number) {
  return softBox(w, h, t, Math.min(t / 2 - 0.005, 0.07), (p, n) => {
    if (Math.abs(n.z) < 0.35) return 0;
    const u = p.x / (w / 2), v = p.y / (h / 2);
    const belly = 0.045 * (1 - u * u) * (1 - v * v);
    const rr = Math.hypot(u, v);
    const button = -0.06 * Math.exp(-((rr / 0.15) ** 2));
    const fall = Math.max(0, 1 - rr * 0.85);
    const crease = (groove(Math.abs(u) * (w / 2), 0.016, 0.032) + groove(Math.abs(v) * (h / 2), 0.016, 0.032)) * fall;
    return (belly + button + crease) * Math.abs(n.z);
  });
}

/** A row of vertical channel tubes (outer arm panels, headboards). */
export function channelPanel(w: number, h: number, t: number, count: number) {
  const cw = w / count;
  return softBox(w, h, t, Math.min(t / 2 - 0.002, 0.03), (p, n) => {
    if (n.z < 0.3) return 0;
    const f = ((p.x + w / 2) / cw) % 1;
    return (Math.sin(Math.PI * f) * 0.012 - 0.004) * n.z;
  }, 64);
}
