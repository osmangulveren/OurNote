import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { slugify } from "./format";
import { normalizeGlb } from "./glb";

/** GLB files live outside /public so files uploaded at runtime are served too (see app/models/[file]). */
export const MODELS_DIR = process.env.MODELS_DIR || path.join(process.cwd(), "storage", "models");
const SAFE = /^[a-z0-9][a-z0-9._-]*\.glb$/i;
const MAX_BYTES = 60 * 1024 * 1024;

/** Stores a GLB, made true to size when the product width is known. */
export async function saveModel(sku: string, file: File, opts: { widthCm?: number; rotationY?: number } = {}) {
  if (file.size === 0) return null;
  if (file.size > MAX_BYTES) throw new Error("GLB is larger than 60 MB — export with a smaller texture / more decimation.");
  let buf: Uint8Array = Buffer.from(await file.arrayBuffer());
  // GLB magic: "glTF"
  if (Buffer.from(buf.subarray(0, 4)).toString("ascii") !== "glTF") throw new Error("That file is not a binary glTF (.glb).");
  if (opts.widthCm) {
    try {
      buf = (await normalizeGlb(buf, opts.widthCm, opts.rotationY ?? 0)).data;
    } catch (e) {
      // e.g. Draco-compressed files: keep the original, the viewer still scales it on screen
      console.warn(`GLB for ${sku} kept as uploaded:`, e instanceof Error ? e.message : e);
    }
  }
  const name = `${slugify(sku) || "model"}-${Date.now()}.glb`;
  await mkdir(MODELS_DIR, { recursive: true });
  await writeFile(path.join(MODELS_DIR, name), buf);
  return `/models/${name}`;
}

export async function readModel(name: string) {
  if (!SAFE.test(name)) return null;
  try {
    return await readFile(path.join(MODELS_DIR, name));
  } catch {
    return null;
  }
}
