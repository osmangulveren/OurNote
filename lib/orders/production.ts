"use server";

import { revalidatePath } from "next/cache";
import { ProductionStage, NotificationType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { notify } from "@/lib/notifications";
import { logAudit } from "@/lib/audit";
import { syncProductStockTotals } from "@/lib/warehouses/stock";
import { PRODUCTION_STAGE_LABEL, PRODUCTION_STAGE_ORDER } from "./productionStages";

/**
 * Admin üretim aşamasını ileri alır. Sadece sipariş APPROVED+ aşamasındaysa
 * çalışır. WAITING → FRAME_BUILDING → ... → DELIVERED tek yönlü ilerler.
 *
 * - DEPARTED'a geçince Order.status SHIPPED yapılır ve stok düşer (mevcut akışı tetikler).
 * - DELIVERED'a geçince Shipment.deliveredAt set edilir.
 */
export async function advanceProductionStage(orderId: string, nextStage: ProductionStage, note?: string) {
  const session = await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shipment: true },
  });
  if (!order) return { error: "Sipariş bulunamadı." };

  if (order.status === "PENDING" || order.status === "CANCELLED") {
    return { error: "Önce siparişi onaylayın." };
  }

  const currentIdx = PRODUCTION_STAGE_ORDER.indexOf(order.productionStage);
  const nextIdx = PRODUCTION_STAGE_ORDER.indexOf(nextStage);
  if (nextIdx <= currentIdx) {
    return { error: "Aşama yalnızca ileri alınabilir." };
  }
  if (nextIdx - currentIdx > 1) {
    return { error: "Aşamaları sırayla ilerletin." };
  }

  // DEPARTED için shipment zorunlu
  if (nextStage === "DEPARTED" && !order.shipment) {
    return { error: "Önce sevkiyat (TIR / şoför) bilgisi girin." };
  }

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id: orderId },
      data: {
        productionStage: nextStage,
        // PREPARING'e geç → FRAME_BUILDING
        status: order.status === "APPROVED" && nextIdx >= PRODUCTION_STAGE_ORDER.indexOf("FRAME_BUILDING")
          ? "PREPARING"
          : order.status,
      },
    });

    await tx.productionEvent.create({
      data: { orderId, stage: nextStage, note: note ?? null },
    });

    // DEPARTED → SHIPPED + stok hareketleri
    if (nextStage === "DEPARTED") {
      await tx.order.update({ where: { id: orderId }, data: { status: "SHIPPED" } });
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
            orderId,
            note: `Sipariş ${order.orderNumber} sevk edildi`,
          },
        });
      }
      if (order.shipment) {
        await tx.shipment.update({
          where: { id: order.shipment.id },
          data: { status: "IN_TRANSIT", departureAt: new Date() },
        });
      }
    }

    if (nextStage === "DELIVERED" && order.shipment) {
      await tx.shipment.update({
        where: { id: order.shipment.id },
        data: { status: "DELIVERED", deliveredAt: new Date() },
      });
    }
  });

  // Audit log
  await logAudit(prisma, {
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "PRODUCTION_STAGE_ADVANCE",
    entityType: "Order",
    entityId: orderId,
    payload: { from: order.productionStage, to: nextStage, note: note ?? null },
  });

  // Müşteriye bildirim
  await notify(prisma, order.userId, {
    type: nextStage === "DEPARTED" || nextStage === "DELIVERED"
      ? NotificationType.SHIPMENT_UPDATE
      : NotificationType.PRODUCTION_STAGE,
    title: `${order.orderNumber}: ${PRODUCTION_STAGE_LABEL[nextStage]}`,
    body: note ?? undefined,
    link: `/customer/orders/${orderId}`,
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/customer/orders/${orderId}`);
  revalidatePath("/customer");
  return { ok: true };
}
