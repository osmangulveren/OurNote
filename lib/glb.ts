import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { getBounds } from "@gltf-transform/functions";

/**
 * Makes a GLB true to size: optionally turns it to face forward, scales it so its width
 * equals the product's real width (photo-to-3D models come in an arbitrary unit cube),
 * then centres it and stands it on the floor. AR viewers open the file as-is, so this
 * is what makes "view in your room" show the real size.
 */
export async function normalizeGlb(input: Uint8Array, widthCm: number, rotationYDeg = 0) {
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.readBinary(input);
  const root = doc.getRoot();
  const scene = root.getDefaultScene() ?? root.listScenes()[0];
  if (!scene) throw new Error("GLB has no scene");

  const wrapper = doc.createNode("ProductRoot");
  for (const child of scene.listChildren()) {
    scene.removeChild(child);
    wrapper.addChild(child);
  }
  scene.addChild(wrapper);

  const a = (rotationYDeg * Math.PI) / 180 / 2;
  wrapper.setRotation([0, Math.sin(a), 0, Math.cos(a)]);
  const before = getBounds(scene);
  const width = before.max[0] - before.min[0];
  const k = width > 0 && widthCm > 0 ? widthCm / 100 / width : 1;
  wrapper.setScale([k, k, k]);
  const b = getBounds(scene);
  wrapper.setTranslation([-(b.min[0] + b.max[0]) / 2, -b.min[1], -(b.min[2] + b.max[2]) / 2]);

  const out = await io.writeBinary(doc);
  const after = getBounds(scene);
  return {
    data: out,
    size: [after.max[0] - after.min[0], after.max[1] - after.min[1], after.max[2] - after.min[2]].map((v) => Math.round(v * 100)),
  };
}
