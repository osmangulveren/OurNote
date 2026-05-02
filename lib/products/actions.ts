"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { ProductCategory, FabricType, FrameType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { D } from "@/lib/money";

const optInt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().int().min(0).max(10_000_000).optional(),
);
const optDec = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.union([z.string(), z.number()]).optional(),
);
const optStr = z.preprocess(
  (v) => (v === null || v === undefined || v === "" ? undefined : String(v)),
  z.string().max(500).optional(),
);

const productSchema = z.object({
  sku: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(2000).optional().or(z.literal("")),
  unit: z.string().trim().min(1).max(20),
  price: z.coerce.number().nonnegative().max(10_000_000),
  vatRate: z.coerce.number().min(0).max(100),
  stockQuantity: z.coerce.number().int().min(0).max(10_000_000),
  isActive: z.coerce.boolean().optional(),
  category: z.nativeEnum(ProductCategory),
  collection: optStr,
  designer: optStr,
  modelInfo: optStr,
  widthCm: optInt,
  depthCm: optInt,
  heightCm: optInt,
  seatWidthCm: optInt,
  seatDepthCm: optInt,
  seatHeightCm: optInt,
  seatCount: optInt,
  weightKg: optDec,
  fabricType: z.preprocess((v) => (v === "" ? undefined : v), z.nativeEnum(FabricType).optional()),
  fabricColor: optStr,
  fabricColorHex: optStr,
  frameType: z.preprocess((v) => (v === "" ? undefined : v), z.nativeEnum(FrameType).optional()),
  foamDensityKgM3: optInt,
  durabilityMartindale: optInt,
  warrantyMonths: optInt,
  leadTimeDays: optInt,
  careInstructions: z.string().trim().max(2000).optional().or(z.literal("")),
  availableFabricColors: z.string().optional().or(z.literal("")),
  availableCompositions: z.string().optional().or(z.literal("")),
  availableAddons: z.string().optional().or(z.literal("")),
});

function parseJsonOrNull(s?: string): any {
  if (!s || !s.trim()) return null;
  try { return JSON.parse(s); } catch { return null; }
}

export type ProductFormState = { error?: string; ok?: boolean };

function fd(form: FormData) {
  return {
    sku: form.get("sku"),
    name: form.get("name"),
    description: form.get("description") ?? "",
    unit: form.get("unit") ?? "adet",
    price: form.get("price"),
    vatRate: form.get("vatRate"),
    stockQuantity: form.get("stockQuantity"),
    isActive: form.get("isActive") === "on" || form.get("isActive") === "true",
    category: form.get("category"),
    collection: form.get("collection"),
    designer: form.get("designer"),
    modelInfo: form.get("modelInfo"),
    widthCm: form.get("widthCm"),
    depthCm: form.get("depthCm"),
    heightCm: form.get("heightCm"),
    seatWidthCm: form.get("seatWidthCm"),
    seatDepthCm: form.get("seatDepthCm"),
    seatHeightCm: form.get("seatHeightCm"),
    seatCount: form.get("seatCount"),
    weightKg: form.get("weightKg"),
    fabricType: form.get("fabricType"),
    fabricColor: form.get("fabricColor"),
    fabricColorHex: form.get("fabricColorHex"),
    frameType: form.get("frameType"),
    foamDensityKgM3: form.get("foamDensityKgM3"),
    durabilityMartindale: form.get("durabilityMartindale"),
    warrantyMonths: form.get("warrantyMonths"),
    leadTimeDays: form.get("leadTimeDays"),
    careInstructions: form.get("careInstructions") ?? "",
    availableFabricColors: form.get("availableFabricColors") ?? "",
    availableCompositions: form.get("availableCompositions") ?? "",
    availableAddons: form.get("availableAddons") ?? "",
  };
}

function dataFromParsed(data: z.infer<typeof productSchema>) {
  return {
    sku: data.sku,
    name: data.name,
    description: data.description || null,
    unit: data.unit,
    price: new D(data.price),
    vatRate: new D(data.vatRate),
    stockQuantity: data.stockQuantity,
    isActive: data.isActive ?? true,
    category: data.category,
    collection: data.collection ?? null,
    designer: data.designer ?? null,
    modelInfo: data.modelInfo ?? null,
    widthCm: data.widthCm ?? null,
    depthCm: data.depthCm ?? null,
    heightCm: data.heightCm ?? null,
    seatWidthCm: data.seatWidthCm ?? null,
    seatDepthCm: data.seatDepthCm ?? null,
    seatHeightCm: data.seatHeightCm ?? null,
    seatCount: data.seatCount ?? null,
    weightKg: data.weightKg !== undefined ? new D(data.weightKg) : null,
    fabricType: data.fabricType ?? null,
    fabricColor: data.fabricColor ?? null,
    fabricColorHex: data.fabricColorHex ?? null,
    frameType: data.frameType ?? null,
    foamDensityKgM3: data.foamDensityKgM3 ?? null,
    durabilityMartindale: data.durabilityMartindale ?? null,
    warrantyMonths: data.warrantyMonths ?? null,
    leadTimeDays: data.leadTimeDays ?? null,
    careInstructions: data.careInstructions || null,
    availableFabricColors: parseJsonOrNull(data.availableFabricColors as any) ?? undefined,
    availableCompositions: parseJsonOrNull(data.availableCompositions as any) ?? undefined,
    availableAddons: parseJsonOrNull(data.availableAddons as any) ?? undefined,
  };
}

export async function createProduct(_: ProductFormState, form: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = productSchema.safeParse(fd(form));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Geçersiz ürün verisi" };
  }
  const data = parsed.data;
  const exists = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (exists) return { error: "Bu SKU zaten kayıtlı." };

  const created = await prisma.product.create({ data: dataFromParsed(data) });

  revalidatePath("/admin/products");
  redirect(`/admin/products/${created.id}`);
}

export async function updateProduct(id: string, _: ProductFormState, form: FormData): Promise<ProductFormState> {
  await requireAdmin();
  const parsed = productSchema.safeParse(fd(form));
  if (!parsed.success) {
    return { error: parsed.error.errors[0]?.message ?? "Geçersiz ürün verisi" };
  }
  const data = parsed.data;

  const current = await prisma.product.findUnique({ where: { id } });
  if (!current) return { error: "Ürün bulunamadı." };
  if (data.stockQuantity < current.reservedQuantity) {
    return { error: "Stok, rezerve edilen miktarın altına düşürülemez." };
  }

  const stockDelta = data.stockQuantity - current.stockQuantity;

  await prisma.$transaction(async (tx) => {
    await tx.product.update({ where: { id }, data: dataFromParsed(data) });

    if (stockDelta !== 0) {
      await tx.stockMovement.create({
        data: {
          productId: id,
          type: "MANUAL_ADJUSTMENT",
          quantity: stockDelta,
          note: `Admin manuel düzenleme (${current.stockQuantity} → ${data.stockQuantity})`,
        },
      });
    }
  });

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  return { ok: true };
}

export async function toggleProductActive(id: string) {
  await requireAdmin();
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return;
  await prisma.product.update({ where: { id }, data: { isActive: !p.isActive } });
  revalidatePath("/admin/products");
}
