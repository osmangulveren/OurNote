"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireCustomer } from "@/lib/auth/session";

export async function getOrCreateCart(userId: string) {
  return prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
    include: { items: { include: { product: true } } },
  });
}

const addSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().min(1).max(10_000),
});

export async function addToCart(productId: string, quantity: number) {
  const session = await requireCustomer();
  const userId = session.user!.id;

  const parsed = addSchema.safeParse({ productId, quantity });
  if (!parsed.success) return { error: "Geçersiz miktar." };

  const product = await prisma.product.findUnique({ where: { id: parsed.data.productId } });
  if (!product || !product.isActive) return { error: "Ürün bulunamadı." };

  const cart = await prisma.cart.upsert({
    where: { userId },
    update: {},
    create: { userId },
  });

  const existing = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId: parsed.data.productId } },
  });

  const newQty = (existing?.quantity ?? 0) + parsed.data.quantity;
  const available = product.stockQuantity - product.reservedQuantity;
  if (newQty > available) {
    return { error: `Stok yetersiz. Kullanılabilir: ${available}` };
  }

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { quantity: newQty },
    });
  } else {
    await prisma.cartItem.create({
      data: { cartId: cart.id, productId: product.id, quantity: parsed.data.quantity },
    });
  }

  revalidatePath("/customer/cart");
  revalidatePath("/customer/products");
  return { ok: true };
}

export async function updateCartItem(itemId: string, quantity: number) {
  const session = await requireCustomer();
  const userId = session.user!.id;

  const item = await prisma.cartItem.findUnique({
    where: { id: itemId },
    include: { cart: true, product: true },
  });
  if (!item || item.cart.userId !== userId) return { error: "Sepet bulunamadı." };

  if (quantity <= 0) {
    await prisma.cartItem.delete({ where: { id: itemId } });
  } else {
    const available = item.product.stockQuantity - item.product.reservedQuantity;
    if (quantity > available) {
      return { error: `Stok yetersiz. Kullanılabilir: ${available}` };
    }
    await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  }
  revalidatePath("/customer/cart");
  return { ok: true };
}

export async function removeCartItem(itemId: string) {
  const session = await requireCustomer();
  const userId = session.user!.id;
  const item = await prisma.cartItem.findUnique({ where: { id: itemId }, include: { cart: true } });
  if (!item || item.cart.userId !== userId) return;
  await prisma.cartItem.delete({ where: { id: itemId } });
  revalidatePath("/customer/cart");
}
