import { parseJson } from "./format";

/** Parameters for the procedural 3D model of a product (all sizes in cm). */
export type Shape = {
  type: "sofa" | "corner" | "armchair" | "bed" | "pouf" | "bench" | "headboard" | "swatch";
  width: number;
  depth: number;
  height: number;
  armWidth?: number;
  seatHeight?: number;
  armHeight?: number;
  curved?: boolean; // rounded, sculpted arms and back
  backCushions?: number;
  seatCushions?: number;
  openDepth?: number; // sofa beds: depth when opened
  chaiseDepth?: number; // corner sofas
  legs?: "chrome" | "wood" | "hidden" | "black";
  channels?: boolean; // vertical channel stitching on arms / headboard
  armStyle?: "roll"; // padded roll cap that overhangs the arm (e.g. Milano)
  quilt?: [number, number]; // seat quilting columns × rows (single seat block)
  tufted?: boolean; // loose back pillows with star tufting
  modelRotationY?: number; // degrees, to face an imported GLB forward
  modelTint?: boolean; // recolour an imported GLB with the chosen fabric (default true)
};

export function shapeOf(p: { shape: string; dimensions?: string }): Shape {
  const s = parseJson<Partial<Shape>>(p.shape, {});
  return { type: "sofa", width: 200, depth: 90, height: 85, ...s };
}

/** Rough packed box (cm) of one unit — used by the truck load planner. */
export function packedBox(shape: Shape, volumeM3: number) {
  const w = shape.width;
  const d = shape.type === "corner" ? (shape.chaiseDepth ?? 160) : shape.depth;
  const h = shape.height;
  // Scale the bounding box so its volume matches the declared packed volume.
  const bbox = (w * d * h) / 1e6;
  const k = volumeM3 > 0 && bbox > 0 ? Math.cbrt(volumeM3 / bbox) : 1;
  return { w: w * k, d: d * k, h: h * k };
}
