"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireCustomer, requireSession } from "@/lib/auth/session";
import { D, round2 } from "@/lib/money";
import { effectiveUnitPrice, loadCustomerPricingContext } from "@/lib/pricing";
import { logAudit } from "@/lib/audit";
import { allocateAcrossWarehouses, syncProductStockTotals } from "@/lib/warehouses/stock";

const PAYMENT_METHODS = new Set([
  "CREDIT_CARD","BANK_CARD","CASH","CHECK","CASH_ON_DELIVERY","WIRE_TRANSFER",
]);

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
export async function placeOrder(formData?: FormData) {
  const session = await requireCustomer();
  const userId = session.user!.id;
  const paymentMethodRaw = formData?.get("paymentMethod")?.toString() ?? "WIRE_TRANSFER";
  const paymentMethod = (PAYMENT_METHODS.has(paymentMethodRaw) ? paymentMethodRaw : "WIRE_TRANSFER") as any;

  const cart = await prisma.cart.findUnique({
    where: { userId },
    include: { items: { include: { product: true } } },
  });

  if (!cart || cart.items.length === 0) {
    return { error: "Sepetiniz boş." };
  }

  const pricingCtx = await loadCustomerPricingContext(prisma, userId);

  let createdOrderId: string | null = null;
  try {
    createdOrderId = await prisma.$transaction(async (tx) => {
      let subtotal = new D(0);
      let vatTotal = new D(0);
      const itemsData: Array<Prisma.OrderItemCreateManyOrderInput> = [];

      for (const item of cart.items) {
        const fresh = await tx.product.findUnique({ where: { id: item.productId } });
        if (!fresh || !fresh.isActive) throw new Error(`${item.product.name} artık satışta değil.`);

        const config = (item.configuration as any) ?? null;
        const compMultiplier = Number(config?.composition?.priceMultiplier ?? 1);
        const addonsDelta = Array.isArray(config?.addons)
          ? config.addons.reduce((s: number, a: any) => s + Number(a?.priceDelta ?? 0), 0)
          : 0;

        const baseUnit = effectiveUnitPrice(fresh.price as any, fresh.id, pricingCtx);
        const unitPrice = round2(baseUnit.mul(compMultiplier).add(new D(addonsDelta)));
        const vatRate = new D(fresh.vatRate);
        const lineSubtotal = round2(unitPrice.mul(item.quantity));
        const lineVat = round2(lineSubtotal.mul(vatRate).div(100));
        const lineTotal = round2(lineSubtotal.add(lineVat));

        subtotal = subtotal.add(lineSubtotal);
        vatTotal = vatTotal.add(lineVat);

        const allocation = await allocateAcrossWarehouses(tx, fresh.id, item.quantity);

        itemsData.push({
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
          configuration: config ?? Prisma.JsonNull,
          warehouseAllocation: allocation as any,
        });

        // Reservation per warehouse
        for (const a of allocation) {
          await tx.warehouseStock.update({
            where: { id: a.warehouseStockId },
            data: { reservedQuantity: { increment: a.quantity } },
          });
        }
        await syncProductStockTotals(tx, fresh.id);
      }

      const grandTotal = round2(subtotal.add(vatTotal));
      const created = await tx.order.create({
        data: {
          orderNumber: generateOrderNumber(),
          userId,
          status: OrderStatus.PENDING,
          paymentMethod,
          subtotal: round2(subtotal),
          vatTotal: round2(vatTotal),
          grandTotal,
          items: { createMany: { data: itemsData } },
        },
      });

      for (const item of cart.items) {
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
      return created.id;
    });
  } catch (e: any) {
    return { error: e?.message ?? "Sipariş oluşturulamadı." };
  }

  revalidatePath("/customer/cart");
  revalidatePath("/customer/orders");
  redirect(`/customer/orders/${createdOrderId}`);
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
  const session = await requireAdmin();

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
        const allocation = (item.warehouseAllocation as any[]) ?? [];
        for (const a of allocation) {
          await tx.warehouseStock.update({
            where: { warehouseId_productId: { warehouseId: a.warehouseId, productId: item.productId } },
            data: {
              stockQuantity: { decrement: a.quantity },
              reservedQuantity: { decrement: a.quantity },
            },
          });
        }
        await syncProductStockTotals(tx, item.productId);
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: "SHIP",
            quantity: -item.quantity,
            orderId: order.id,
            note: `Sipariş ${order.orderNumber} sevk edildi`,
          },
        });
      }
    } else if (next === "CANCELLED") {
      for (const item of order.items) {
        const allocation = (item.warehouseAllocation as any[]) ?? [];
        for (const a of allocation) {
          await tx.warehouseStock.update({
            where: { warehouseId_productId: { warehouseId: a.warehouseId, productId: item.productId } },
            data: { reservedQuantity: { decrement: a.quantity } },
          });
        }
        await syncProductStockTotals(tx, item.productId);
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

  await logAudit(prisma, {
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "ORDER_STATUS_CHANGE",
    entityType: "Order",
    entityId: orderId,
    payload: { to: next },
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
  if (role === "CUSTOMER" && order.userId !== session.user!.id) return null;
  return order;
}
