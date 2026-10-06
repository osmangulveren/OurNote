// Fabric library shared by the 3D viewer, swatches and the sample-kit request.
export type FabricKind = "velvet" | "boucle" | "linen";

export type Fabric = { name: string; hex: string; kind: FabricKind };

export const FABRICS: Fabric[] = [
  { name: "Sand Velvet", hex: "#c9b79c", kind: "velvet" },
  { name: "Taupe Velvet", hex: "#8f7f72", kind: "velvet" },
  { name: "Moss Velvet", hex: "#5f6b45", kind: "velvet" },
  { name: "Terracotta Velvet", hex: "#a8573a", kind: "velvet" },
  { name: "Ink Velvet", hex: "#2f3a4f", kind: "velvet" },
  { name: "Graphite Velvet", hex: "#4a4a4c", kind: "velvet" },
  { name: "Ecru Bouclé", hex: "#e6dfd2", kind: "boucle" },
  { name: "Oat Bouclé", hex: "#cdbfa8", kind: "boucle" },
  { name: "Stone Bouclé", hex: "#a39d93", kind: "boucle" },
  { name: "Natural Linen", hex: "#d6ccbb", kind: "linen" },
  { name: "Olive Linen", hex: "#7d7a5a", kind: "linen" },
];

const byName = new Map(FABRICS.map((f) => [f.name.toLowerCase(), f]));

export function fabricOf(name: string): Fabric {
  return byName.get(name.toLowerCase()) ?? { name, hex: "#b9ad9c", kind: "velvet" };
}

export const FABRIC_KIND_LABEL: Record<FabricKind, string> = {
  velvet: "Velvet · 300 g/m² · Martindale 50,000",
  boucle: "Bouclé · 520 g/m² · Martindale 40,000",
  linen: "Linen-look · 330 g/m² · Martindale 35,000",
};
