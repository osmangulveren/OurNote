import type { Product, Category } from "@prisma/client";
import { parseJson } from "./format";
import { shapeOf, type Shape } from "./shape";

/** Serializable product data for client components. Prices only when the viewer may see them. */
export type CardProduct = {
  id: string; slug: string; name: string; sku: string; category: string; categorySlug: string;
  shortDescription: string; colors: string[]; tags: string[]; shape: Shape;
  moq: number; unit: string; leadTimeDays: number; volumeM3: number;
  price: number | null; rrp: number | null; featured: boolean;
};

export function toCard(p: Product & { category: Category }, showPrices: boolean): CardProduct {
  return {
    id: p.id, slug: p.slug, name: p.name, sku: p.sku, category: p.category.name, categorySlug: p.category.slug,
    shortDescription: p.shortDescription, colors: parseJson<string[]>(p.colors, []), tags: parseJson<string[]>(p.tags, []),
    shape: shapeOf(p), moq: p.moq, unit: p.unit, leadTimeDays: p.leadTimeDays, volumeM3: p.volumeM3,
    price: showPrices ? p.price : null, rrp: showPrices && p.rrp ? p.rrp : null, featured: p.featured,
  };
}
