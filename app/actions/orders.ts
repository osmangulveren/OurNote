"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireBuyer } from "@/lib/auth";
import { ALL_COUNTRIES, config } from "@/lib/config";
import { db } from "@/lib/db";
import { nextOrderNumber } from "@/lib/orders";
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
});

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

  const lines = cart.map((c) => {
    const price = unitPrice(c.product, c.quantity);
    return { c, unitPrice: price, quantity: c.quantity, volumeM3: c.product.volumeM3 };
  });
  // VAT treatment follows the buyer company's registration, not the delivery address.
  const totals = computeTotals({ lines, country: user.company.country, vatNumber: user.company.vatNumber });

  const order = await db.order.create({
    data: {
      number: await nextOrderNumber(),
      companyId: user.company.id,
      userId: user.id,
      paymentMethod: d.paymentMethod,
      subtotal: totals.subtotal,
      freight: totals.freight,
      vatRate: totals.vatRate,
      vatAmount: totals.vatAmount,
      vatNote: totals.vatNote,
      total: totals.total,
      totalVolumeM3: totals.volume,
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
    const s = stripe()!;
    // One line for the full amount keeps Stripe's total identical to our invoice (VAT, freight included).
    const session = await s.checkout.sessions.create({
      mode: "payment",
      customer_email: user.email,
      client_reference_id: order.id,
      metadata: { orderId: order.id },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "eur",
            unit_amount: Math.round(order.total * 100),
            product_data: { name: `${config.brandName} order ${order.number}` },
          },
        },
      ],
      success_url: `${config.appUrl}/orders/${order.id}?paid=1`,
      cancel_url: `${config.appUrl}/orders/${order.id}`,
    });
    await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id } });
    redirect(session.url!);
  }
  redirect(`/orders/${order.id}?placed=1`);
}

/** Lets the buyer retry card payment for an unpaid order. */
export async function payOrder(form: FormData) {
  const user = await requireBuyer();
  const order = await db.order.findFirst({ where: { id: String(form.get("orderId")), companyId: user.company.id } });
  const s = stripe();
  if (!order || order.paymentStatus === "PAID" || order.status === "CANCELLED" || !s) return;
  const session = await s.checkout.sessions.create({
    mode: "payment",
    customer_email: user.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id },
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "eur",
          unit_amount: Math.round(order.total * 100),
          product_data: { name: `${config.brandName} order ${order.number}` },
        },
      },
    ],
    success_url: `${config.appUrl}/orders/${order.id}?paid=1`,
    cancel_url: `${config.appUrl}/orders/${order.id}`,
  });
  await db.order.update({ where: { id: order.id }, data: { stripeSessionId: session.id, paymentMethod: "STRIPE" } });
  redirect(session.url!);
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
