import type { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { slugify } from "./format";

const Category = z.object({
  slug: z.string().optional(),
  name: z.string().min(1),
  description: z.string().default(""),
});

const Product = z.object({
  sku: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1), // category slug or name
  shortDescription: z.string().default(""),
  description: z.string().default(""),
  images: z.array(z.string()).default([]),
  price: z.number().positive(),
  priceTiers: z.array(z.object({ minQty: z.number().int().positive(), price: z.number().positive() })).default([]),
  moq: z.number().int().positive().default(1),
  unit: z.string().default("pcs"),
  unitsPerCarton: z.number().int().positive().default(1),
  leadTimeDays: z.number().int().nonnegative().default(21),
  dimensions: z.string().default(""),
  weightKg: z.number().nonnegative().default(0),
  volumeM3: z.number().nonnegative().default(0),
  material: z.string().default(""),
  colors: z.array(z.string()).default([]),
  specs: z.array(z.object({ label: z.string(), value: z.string() })).default([]),
  featured: z.boolean().default(false),
  rrp: z.number().nonnegative().default(0),
  tags: z.array(z.string()).default([]),
  shape: z.record(z.string(), z.unknown()).default({}),
  modelUrl: z.string().default(""),
  active: z.boolean().default(true),
  supplierName: z.string().default(""),
  supplierPrice: z.number().nonnegative().default(0),
  sourceUrl: z.string().default(""),
});

export const CatalogFile = z.object({
  categories: z.array(Category).default([]),
  products: z.array(Product),
});

export type CatalogFileInput = z.input<typeof CatalogFile>;

/** Upserts categories and products (matched by slug / SKU). Never deletes anything. */
export async function importCatalog(db: PrismaClient, raw: unknown) {
  const data = CatalogFile.parse(raw);
  const catIds = new Map<string, string>();

  const ensureCategory = async (c: { slug?: string; name: string; description?: string }, order: number) => {
    const slug = c.slug || slugify(c.name);
    const cat = await db.category.upsert({
      where: { slug },
      create: { slug, name: c.name, description: c.description ?? "", sortOrder: order },
      update: { name: c.name, description: c.description ?? "", sortOrder: order },
    });
    catIds.set(slug, cat.id);
    catIds.set(c.name.toLowerCase(), cat.id);
    return cat.id;
  };

  let order = 0;
  for (const c of data.categories) await ensureCategory(c, order++);

  let created = 0;
  let updated = 0;
  for (const p of data.products) {
    const categoryId =
      catIds.get(p.category) ?? catIds.get(p.category.toLowerCase()) ?? (await ensureCategory({ name: p.category }, order++));
    const fields = {
      name: p.name,
      categoryId,
      shortDescription: p.shortDescription,
      description: p.description,
      images: JSON.stringify(p.images),
      price: p.price,
      priceTiers: JSON.stringify(p.priceTiers),
      moq: p.moq,
      unit: p.unit,
      unitsPerCarton: p.unitsPerCarton,
      leadTimeDays: p.leadTimeDays,
      dimensions: p.dimensions,
      weightKg: p.weightKg,
      volumeM3: p.volumeM3,
      material: p.material,
      colors: JSON.stringify(p.colors),
      specs: JSON.stringify(p.specs),
      featured: p.featured,
      rrp: p.rrp,
      tags: JSON.stringify(p.tags),
      shape: JSON.stringify(p.shape),
      modelUrl: p.modelUrl,
      active: p.active,
      supplierName: p.supplierName,
      supplierPrice: p.supplierPrice,
      sourceUrl: p.sourceUrl,
    };
    const existing = await db.product.findUnique({ where: { sku: p.sku } });
    if (existing) {
      await db.product.update({ where: { id: existing.id }, data: fields });
      updated++;
    } else {
      let slug = slugify(`${p.name}-${p.sku}`);
      if (await db.product.findUnique({ where: { slug } })) slug = `${slug}-${Date.now()}`;
      await db.product.create({ data: { ...fields, sku: p.sku, slug } });
      created++;
    }
  }
  return { created, updated, categories: data.categories.length };
}
