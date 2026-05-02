"use server";

import { revalidatePath } from "next/cache";
import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";

const UPLOAD_DIR = path.join(process.cwd(), "public", "products", "uploads");
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const MAX_BYTES = 8 * 1024 * 1024; // 8MB / dosya

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/png": return ".png";
    case "image/jpeg": return ".jpg";
    case "image/webp": return ".webp";
    case "image/gif": return ".gif";
    default: return ".bin";
  }
}

export async function uploadProductImages(productId: string, formData: FormData) {
  await requireAdmin();
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { images: true } });
  if (!product) return { error: "Ürün bulunamadı." };

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) return { error: "Dosya seçilmedi." };

  await fs.mkdir(UPLOAD_DIR, { recursive: true });

  let nextOrder = product.images.reduce((m, i) => Math.max(m, i.sortOrder), -1) + 1;
  const hasCover = product.images.some((i) => i.isCover);

  for (const file of files) {
    if (!ALLOWED_MIME.has(file.type)) return { error: `Geçersiz dosya tipi: ${file.type}` };
    if (file.size > MAX_BYTES) return { error: `${file.name} 8MB sınırını aşıyor.` };

    const ext = extFromMime(file.type);
    const id = crypto.randomBytes(12).toString("hex");
    const filename = `${id}${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(UPLOAD_DIR, filename), buffer);

    await prisma.productImage.create({
      data: {
        productId,
        url: `/products/uploads/${filename}`,
        alt: product.name,
        sortOrder: nextOrder++,
        isCover: !hasCover && nextOrder === product.images.length + 1, // ilk yüklenen cover
      },
    });
  }

  revalidatePath(`/admin/products/${productId}`);
  return { ok: true };
}

export async function deleteProductImage(imageId: string) {
  await requireAdmin();
  const img = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!img) return;

  // Sadece uploads/ altındakileri diskten sil; seed dosyalarını koru
  if (img.url.startsWith("/products/uploads/")) {
    const filename = path.basename(img.url);
    try { await fs.unlink(path.join(UPLOAD_DIR, filename)); } catch {/* yok say */}
  }

  await prisma.productImage.delete({ where: { id: imageId } });

  // Cover silindiyse ilk kalanı cover yap
  if (img.isCover) {
    const next = await prisma.productImage.findFirst({
      where: { productId: img.productId },
      orderBy: { sortOrder: "asc" },
    });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isCover: true } });
  }

  revalidatePath(`/admin/products/${img.productId}`);
}

export async function setCoverImage(imageId: string) {
  await requireAdmin();
  const img = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!img) return;
  await prisma.$transaction([
    prisma.productImage.updateMany({ where: { productId: img.productId }, data: { isCover: false } }),
    prisma.productImage.update({ where: { id: imageId }, data: { isCover: true } }),
  ]);
  revalidatePath(`/admin/products/${img.productId}`);
}

export async function moveImage(imageId: string, direction: "up" | "down") {
  await requireAdmin();
  const img = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!img) return;
  const all = await prisma.productImage.findMany({
    where: { productId: img.productId },
    orderBy: { sortOrder: "asc" },
  });
  const idx = all.findIndex((i) => i.id === imageId);
  if (idx === -1) return;
  const swapIdx = direction === "up" ? idx - 1 : idx + 1;
  if (swapIdx < 0 || swapIdx >= all.length) return;

  const a = all[idx], b = all[swapIdx];
  await prisma.$transaction([
    prisma.productImage.update({ where: { id: a.id }, data: { sortOrder: b.sortOrder } }),
    prisma.productImage.update({ where: { id: b.id }, data: { sortOrder: a.sortOrder } }),
  ]);
  revalidatePath(`/admin/products/${img.productId}`);
}
