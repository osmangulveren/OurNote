"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { D } from "@/lib/money";

const productSchema = z.object({
  sku: z.string().trim().min(2).max(64),
  name: z.string().trim().min(2).max(200),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  unit: z.string().trim().min(1).max(20),
  price: z.coerce.number().nonnegative().max(1_000_000),
  vatRate: z.coerce.number().min(0).max(100),
  stockQuantity: z.coerce.number().int().min(0).max(10_000_000),
  isActive: z.coerce.boolean().optional(),
});

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

  await prisma.product.create({
    data: {
      sku: data.sku,
      name: data.name,
      description: data.description || null,
      unit: data.unit,
      price: new D(data.price),
      vatRate: new D(data.vatRate),
      stockQuantity: data.stockQuantity,
      isActive: data.isActive ?? true,
    },
  });

  revalidatePath("/admin/products");
  redirect("/admin/products");
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
    await tx.product.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        description: data.description || null,
        unit: data.unit,
        price: new D(data.price),
        vatRate: new D(data.vatRate),
        stockQuantity: data.stockQuantity,
        isActive: data.isActive ?? true,
      },
    });

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
  redirect("/admin/products");
}

export async function toggleProductActive(id: string) {
  await requireAdmin();
  const p = await prisma.product.findUnique({ where: { id } });
  if (!p) return;
  await prisma.product.update({ where: { id }, data: { isActive: !p.isActive } });
  revalidatePath("/admin/products");
}
