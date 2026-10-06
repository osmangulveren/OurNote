"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBuyer } from "@/lib/auth";
import { ALL_COUNTRIES, config } from "@/lib/config";
import { db } from "@/lib/db";
import { amountDue, bookableDepartures, nextOrderNumber, readyDate } from "@/lib/orders";
import { computeTotals, unitPrice } from "@/lib/pricing";
import { stripe } from "@/lib/stripe";

export type CheckoutState = { error?: string } | undefined;

const CheckoutSchema = z.object({
  deliveryName: z.string().trim().min(2),
  deliveryAddress: z.string().trim().min(3),
  deliveryCity: z.string().trim().min(1),
  deliveryPostal: z.string().trim().min(2),
  deliveryCountry: z.string().refine((c) => c in ALL_COUNTRIES),
  deliveryPhone: z.string().trim().min(5),
  notes: z.string().trim().max(2000).default(""),
  paymentMethod: z.enum(["STRIPE", "BANK_TRANSFER"]),
  paymentPlan: z.enum(["FULL", "DEPOSIT"]),
  departureId: z.string().default(""),
});

async function stripeCheckout(order: { id: string; number: string }, amount: number, kind: "DEPOSIT" | "BALANCE", email: string) {
  const s = stripe()!;
  const label = kind === "DEPOSIT" ? `${config.depositPercent}% deposit` : "payment";
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: email,
    client_reference_id: order.id,
    metadata: { orderId: order.id, kind },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(amount * 100),
          product_data: { name: `${config.brandName} order ${order.number} – ${label}` },
        },
      },
    ],
    success_url: `${config.appUrl}/orders/${order.id}?paid=1`,
    cancel_url: `${config.appUrl}/orders/${order.id}`,
  });
  await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
  return session.url!;
}

export async function placeOrder(_: CheckoutState, form: FormData): Promise<CheckoutState> {
  const user = await requireBuyer();
  const parsed = CheckoutSchema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Please complete all delivery fields." };
  const d = parsed.data;
  if (d.paymentMethod === "STRIPE" && !config.stripeEnabled) return { error: "Card payment is not available." };

  const cart = await db.cartItem.findMany({ where: { userId: user.id }, include: { product: true } });
  if (cart.length === 0) return { error: "Your cart is empty." };
  const inactive = cart.find((c) => !c.product.active);
  if (inactive) return { error: `${inactive.product.name} is no longer available. Please remove it.` };

  const lines = cart.map((c) => ({ c, unitPrice: unitPrice(c.product, c.quantity), quantity: c.quantity, volumeM3: c.product.volumeM3 }));
  // VAT treatment follows the buyer company's registration, not the delivery address.
  const totals = computeTotals({ lines, country: user.company.country, vatNumber: user.company.vatNumber });

  let shipmentId: string | null = null;
  if (d.departureId) {
    const dep = (await bookableDepartures()).find((x) => x.id === d.departureId);
    if (!dep) return { error: "That truck is no longer open for booking. Please choose another." };
    if (dep.free < totals.volume) return { error: `Only ${dep.free} m³ left on ${dep.code}. Choose a later truck or reduce the order.` };
    const lead = Math.max(...cart.map((c) => c.product.leadTimeDays));
    if (dep.plannedDepartureAt && dep.plannedDepartureAt < readyDate(lead)) {
      return { error: `${dep.code} leaves before production (${lead} days) can be finished. Choose a later truck.` };
    }
    shipmentId = dep.id;
  }

  const depositAmount = d.paymentPlan === "DEPOSIT" ? Math.round(totals.total * config.depositPercent) / 100 : 0;
  const order = await db.order.create({
    data: {
      number: await nextOrderNumber(),
      companyId: user.company.id,
      userId: user.id,
      paymentMethod: d.paymentMethod,
      paymentPlan: d.paymentPlan,
      depositAmount,
      subtotal: totals.subtotal,
      freight: totals.freight,
      vatRate: totals.vatRate,
      vatAmount: totals.vatAmount,
      vatNote: totals.vatNote,
      total: totals.total,
      totalVolumeM3: totals.volume,
      shipmentId,
      deliveryName: d.deliveryName,
      deliveryAddress: d.deliveryAddress,
      deliveryCity: d.deliveryCity,
      deliveryPostal: d.deliveryPostal,
      deliveryCountry: d.deliveryCountry,
      deliveryPhone: d.deliveryPhone,
      notes: d.notes,
      items: {
        create: lines.map((l) => ({
          productId: l.c.productId,
          sku: l.c.product.sku,
          name: l.c.product.name,
          color: l.c.color,
          unitPrice: l.unitPrice,
          quantity: l.quantity,
          lineTotal: Math.round(l.unitPrice * l.quantity * 100) / 100,
          volumeM3: l.volumeM3,
        })),
      },
      events: { create: { status: "PENDING_PAYMENT" } },
    },
  });
  await db.cartItem.deleteMany({ where: { userId: user.id } });
  revalidatePath("/", "layout");

  if (d.paymentMethod === "STRIPE") {
    redirect(await stripeCheckout(order, amountDue(order), d.paymentPlan === "DEPOSIT" ? "DEPOSIT" : "BALANCE", user.email));
  }
  redirect(`/orders/${order.id}?placed=1`);
}

/** Card payment of whatever is due now (deposit or remaining balance). */
export async function payOrder(form: FormData) {
  const user = await requireBuyer();
  const order = await db.order.findFirst({ where: { id: String(form.get("orderId")), companyId: user.company.id } });
  if (!order || order.paymentStatus === "PAID" || order.status === "CANCELLED" || !stripe()) return;
  const kind = order.paymentStatus === "UNPAID" && order.paymentPlan === "DEPOSIT" ? "DEPOSIT" : "BALANCE";
  await db.order.update({ where: { id: order.id }, data: { paymentMethod: "STRIPE" } });
  redirect(await stripeCheckout(order, amountDue(order), kind, user.email));
}

export async function reorder(form: FormData) {
  const user = await requireBuyer();
  const order = await db.order.findFirst({
    where: { id: String(form.get("orderId")), companyId: user.company.id },
    include: { items: { include: { product: true } } },
  });
  if (!order) return;
  for (const it of order.items) {
    if (!it.product.active) continue;
    await db.cartItem.upsert({
      where: { userId_productId_color: { userId: user.id, productId: it.productId, color: it.color } },
      create: { userId: user.id, productId: it.productId, color: it.color, quantity: Math.max(it.quantity, it.product.moq) },
      update: { quantity: { increment: it.quantity } },
    });
  }
  redirect("/cart");
}

const ClaimSchema = z.object({
  orderId: z.string(),
  sku: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  kind: z.enum(["DAMAGED", "MISSING", "WRONG_ITEM"]),
  description: z.string().trim().min(5).max(2000),
});

export async function createClaim(form: FormData) {
  const user = await requireBuyer();
  const d = ClaimSchema.parse(Object.fromEntries(form));
  const order = await db.order.findFirst({ where: { id: d.orderId, companyId: user.company.id }, include: { items: true } });
  if (!order || !order.items.some((i) => i.sku === d.sku)) return;
  await db.claim.create({ data: { orderId: order.id, sku: d.sku, quantity: d.quantity, kind: d.kind, description: d.description } });
  revalidatePath(`/orders/${order.id}`);
}

export async function requestSamples(form: FormData) {
  const user = await requireBuyer();
  const fabrics = form.getAll("fabric").map(String).filter(Boolean);
  if (fabrics.length === 0) return;
  await db.sampleRequest.create({
    data: { companyId: user.company.id, fabrics: JSON.stringify(fabrics), note: String(form.get("note") ?? "").slice(0, 500) },
  });
  redirect("/fabrics?requested=1");
}
