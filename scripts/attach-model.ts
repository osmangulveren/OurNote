// Attach a GLB (e.g. from scripts/photo-to-3d/trellis2_to_glb.py) to a product.
// Usage: npm run model:attach -- <SKU> <file.glb> [--rotate 90]
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { slugify } from "../lib/format";
import { normalizeGlb } from "../lib/glb";

const [sku, file, flag, deg] = process.argv.slice(2);
if (!sku || !file) {
  console.error("Usage: npm run model:attach -- <SKU> <file.glb> [--rotate <degrees>]");
  process.exit(1);
}
if (readFileSync(file).subarray(0, 4).toString("ascii") !== "glTF") {
  console.error(`${file} is not a binary glTF (.glb)`);
  process.exit(1);
}
const dir = process.env.MODELS_DIR || path.join(process.cwd(), "storage", "models");
const name = `${slugify(sku)}-${Date.now()}.glb`;
mkdirSync(dir, { recursive: true });

async function main() {
  const db = new PrismaClient();
  const product = await db.product.findUnique({ where: { sku } });
  if (!product) throw new Error(`No product with SKU ${sku}`);
  const shape = JSON.parse(product.shape || "{}");
  const rotation = flag === "--rotate" ? Number(deg) || 0 : 0;
  const { data, size } = await normalizeGlb(readFileSync(file), Number(shape.width) || 0, rotation);
  writeFileSync(path.join(dir, name), data);
  shape.modelRotationY = 0; // rotation is baked into the file
  console.log(`  scaled to ${size.join(" × ")} cm (W × H × D)`);
  await db.product.update({ where: { id: product.id }, data: { modelUrl: `/models/${name}`, shape: JSON.stringify(shape) } });
  console.log(`✓ ${sku} now uses /models/${name}`);
  await db.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
