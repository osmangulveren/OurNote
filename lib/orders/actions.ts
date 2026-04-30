"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireCustomer, requireSession } from "@/lib/auth/session";
import { D, round2 } from "@/lib/money";

function generateOrderNumber() {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${stamp}-${rand}`;
}

/**
 * Sipariş oluştur — sepetteki ürünleri OrderItem'a kopyalar,
 * stoktan düşmez, reservedQuantity'yi artırır, RESERVE StockMovement yazar.
 */
export async function placeOrder() {
  const session = await requireCustomer();
  const userId = session.user!.id;

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "Sepetiniz boş." };
  }

  const order = await prisma.$transaction(async (tx) => {
    let subtotal = new D(0);
    let vatTotal = new D(0);

    const items: Prisma.OrderItemCreateManyOrderInput[] = [];

    for (const item of cart.items) {
      const fresh = await tx.product.findUnique({ where: { id: item.productId } });
      if (!fresh || !fresh.isActive) {
        throw new Error(`${item.product.name} artık satışta değil.`);
      }
      const available = fresh.stockQuantity - fresh.reservedQuantity;
      if (item.quantity > available) {
        throw new Error(`${fresh.name} için stok yetersiz (kullanılabilir: ${available}).`);
      }

      const unitPrice = new D(fresh.price);
      const vatRate = new D(fresh.vatRate);
      const lineSubtotal = round2(unitPrice.mul(item.quantity));
      const lineVat = round2(lineSubtotal.mul(vatRate).div(100));
      const lineTotal = round2(lineSubtotal.add(lineVat));

      subtotal = subtotal.add(lineSubtotal);
      vatTotal = vatTotal.add(lineVat);

      items.push({
        productId: fresh.id,
        productName: fresh.name,
        sku: fresh.sku,
        unit: fresh.unit,
        unitPrice,
        vatRate,
        quantity: item.quantity,
        lineSubtotal,
        lineVat,
        lineTotal,
      });
    }

    const grandTotal = round2(subtotal.add(vatTotal));

    const created = await tx.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        status: OrderStatus.PENDING,
        subtotal: round2(subtotal),
        vatTotal: round2(vatTotal),
        grandTotal,
        items: { createMany: { data: items } },
      },
    });

    for (const item of cart.items) {
      await tx.product.update({
        where: { id: item.productId },
        data: { reservedQuantity: { increment: item.quantity } },
      });
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          type: "RESERVE",
          quantity: item.quantity,
          orderId: created.id,
          note: `Sipariş ${created.orderNumber} için rezervasyon`,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return created;
  });

  revalidatePath("/customer/cart");
  revalidatePath("/customer/orders");
  redirect(`/customer/orders/${order.id}`);
}

/**
 * Admin sipariş durumunu değiştirir; geçişe göre stok hareketleri uygular.
 *
 * - APPROVED  : reservedQuantity korunur, hareket yok.
 * - PREPARING : reservedQuantity korunur, hareket yok.
 * - SHIPPED   : stockQuantity ve reservedQuantity düş, SHIP hareketi.
 * - CANCELLED : reservedQuantity düş, RELEASE_RESERVATION hareketi.
 */
export async function updateOrderStatus(orderId: string, next: OrderStatus) {
  await requireAdmin();

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new Error("Sipariş bulunamadı.");
    if (order.status === next) return;

    const isClosed = (s: OrderStatus) => s === "SHIPPED" || s === "CANCELLED";
    if (isClosed(order.status)) {
      throw new Error("Tamamlanmış/iptal edilmiş sipariş değiştirilemez.");
    }

    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      PENDING: ["APPROVED", "CANCELLED"],
      APPROVED: ["PREPARING", "CANCELLED"],
      PREPARING: ["SHIPPED", "CANCELLED"],
      SHIPPED: [],
      CANCELLED: [],
    };
    if (!validTransitions[order.status].includes(next)) {
      throw new Error(`Geçersiz durum geçişi: ${order.status} → ${next}`);
    }

    if (next === "SHIPPED") {
      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product) throw new Error("Ürün bulunamadı.");
        if (product.stockQuantity < item.quantity) {
          throw new Error(`${item.productName} için fiziksel stok yetersiz.`);
        }
        await tx.product.update({
          where: { id: product.id },
          data: {
            stockQuantity: { decrement: item.quantity },
            reservedQuantity: { decrement: item.quantity },
          },
        });
        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "SHIP",
            quantity: -item.quantity,
            orderId: order.id,
            note: `Sipariş ${order.orderNumber} sevk edildi`,
          },
        });
      }
    } else if (next === "CANCELLED") {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { reservedQuantity: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "RELEASE_RESERVATION",
            quantity: -item.quantity,
            orderId: order.id,
            note: `Sipariş ${order.orderNumber} iptal edildi`,
          },
        });
      }
    }

    await tx.order.update({ where: { id: order.id }, data: { status: next } });
  });

  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${orderId}`);
}

export async function getOrderForUser(orderId: string) {
  const session = await requireSession();
  const role = (session.user as any).role;
  const where: Prisma.OrderWhereUniqueInput = { id: orderId };
  const order = await prisma.order.findUnique({
    where,
    include: { items: true, user: { include: { customerProfile: true } }, invoice: true },
  });
  if (!order) return null;
  if (role !== "ADMIN" && order.userId !== session.user!.id) return null;
  return order;
}
