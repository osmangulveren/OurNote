"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireBuyer } from "@/lib/auth";
import { db } from "@/lib/db";

export async function addToCart(form: FormData) {
  const user = await requireBuyer();
  const productId = String(form.get("productId"));
  const color = String(form.get("color") ?? "");
  const product = await db.product.findUnique({ where: { id: productId } });
  if (!product || !product.active) return;
  const qty = Math.max(product.moq, Math.floor(Number(form.get("quantity")) || product.moq));
  await db.cartItem.upsert({
    where: { userId_productId_color: { userId: user.id, productId, color } },
    create: { userId: user.id, productId, color, quantity: qty },
    update: { quantity: { increment: qty } },
  });
  revalidatePath("/", "layout");
  if (form.get("goToCart")) redirect("/cart");
}

export async function updateCartItem(form: FormData) {
  const user = await requireBuyer();
  const id = String(form.get("id"));
  const item = await db.cartItem.findFirst({ where: { id, userId: user.id }, include: { product: true } });
  if (!item) return;
  const qty = Math.floor(Number(form.get("quantity")) || 0);
  if (qty <= 0) await db.cartItem.delete({ where: { id } });
  else await db.cartItem.update({ where: { id }, data: { quantity: Math.max(item.product.moq, qty) } });
  revalidatePath("/", "layout");
}

export async function removeCartItem(form: FormData) {
  const user = await requireBuyer();
  await db.cartItem.deleteMany({ where: { id: String(form.get("id")), userId: user.id } });
  revalidatePath("/", "layout");
}
