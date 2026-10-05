import "server-only";
import { db } from "./db";

export async function nextOrderNumber() {
  const year = new Date().getFullYear();
  const prefix = `ORD-${year}-`;
  const last = await db.order.findFirst({ where: { number: { startsWith: prefix } }, orderBy: { number: "desc" } });
  const n = last ? Number(last.number.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(4, "0")}`;
}

export async function nextShipmentCode() {
  const year = new Date().getFullYear();
  const prefix = `TIR-${year}-`;
  const last = await db.shipment.findFirst({ where: { code: { startsWith: prefix } }, orderBy: { code: "desc" } });
  const n = last ? Number(last.code.slice(prefix.length)) + 1 : 1;
  return `${prefix}${String(n).padStart(3, "0")}`;
}

/** Sets an order's status and records it in the order history (no-op if unchanged). */
export async function setOrderStatus(orderId: string, status: string, note = "") {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.status === status) return;
  await db.order.update({
    where: { id: orderId },
    data: {
      status,
      events: { create: { status, note } },
      ...(status === "DELIVERED" ? { deliveredAt: new Date() } : {}),
    },
  });
}

export async function markOrderPaid(orderId: string, note: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === "PAID") return;
  await db.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", paidAt: new Date() } });
  if (order.status === "PENDING_PAYMENT") await setOrderStatus(orderId, "CONFIRMED", note);
}
