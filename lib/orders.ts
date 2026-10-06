import "server-only";
import { config } from "./config";
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

export const amountDue = (o: { total: number; paidAmount: number; paymentPlan: string; depositAmount: number; paymentStatus: string }) =>
  o.paymentStatus === "UNPAID" && o.paymentPlan === "DEPOSIT" ? o.depositAmount : Math.round((o.total - o.paidAmount) * 100) / 100;

/**
 * Records a received payment. A deposit confirms the order (production starts);
 * the balance (or a full payment) settles it.
 */
export async function recordPayment(orderId: string, kind: "DEPOSIT" | "BALANCE", source: string) {
  const order = await db.order.findUnique({ where: { id: orderId } });
  if (!order || order.paymentStatus === "PAID") return;
  if (kind === "DEPOSIT" && order.paymentStatus === "DEPOSIT_PAID") return;
  const isDeposit = kind === "DEPOSIT" && order.paymentPlan === "DEPOSIT";
  await db.order.update({
    where: { id: orderId },
    data: isDeposit
      ? { paymentStatus: "DEPOSIT_PAID", paidAmount: order.depositAmount, paidAt: new Date() }
      : { paymentStatus: "PAID", paidAmount: order.total, paidAt: order.paidAt ?? new Date() },
  });
  const note = isDeposit ? `${config.depositPercent}% deposit received (${source})` : `Payment received in full (${source})`;
  if (order.status === "PENDING_PAYMENT") await setOrderStatus(orderId, "CONFIRMED", note);
  else await db.orderEvent.create({ data: { orderId, status: order.status, note } });
}

/** Open trucks with how much space is already booked. */
export async function bookableDepartures() {
  const trucks = await db.shipment.findMany({
    where: { bookable: true, stage: "PLANNED", OR: [{ cutoffAt: null }, { cutoffAt: { gte: new Date() } }] },
    include: { orders: { where: { status: { not: "CANCELLED" } }, select: { totalVolumeM3: true, deliveryCountry: true } } },
    orderBy: { plannedDepartureAt: "asc" },
  });
  return trucks.map((t) => {
    const booked = t.orders.reduce((s, o) => s + o.totalVolumeM3, 0);
    return {
      id: t.id, code: t.code, route: t.route, cutoffAt: t.cutoffAt, plannedDepartureAt: t.plannedDepartureAt, eta: t.eta,
      capacity: t.capacityM3, booked: Math.round(booked * 100) / 100, free: Math.max(0, Math.round((t.capacityM3 - booked) * 100) / 100),
      stores: t.orders.length,
    };
  });
}

export type Departure = Awaited<ReturnType<typeof bookableDepartures>>[number];

/** Earliest date the goods can leave the workshop given production lead time. */
export const readyDate = (leadTimeDays: number) => new Date(Date.now() + leadTimeDays * 864e5);
