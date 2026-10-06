import { NextResponse } from "next/server";
import { recordPayment } from "@/lib/orders";
import { stripe } from "@/lib/stripe";

export async function POST(req: Request) {
  const s = stripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!s || !secret) return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  let event;
  try {
    event = s.webhooks.constructEvent(await req.text(), req.headers.get("stripe-signature") ?? "", secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    const kind = session.metadata?.kind === "DEPOSIT" ? "DEPOSIT" : "BALANCE";
    if (orderId && session.payment_status === "paid") await recordPayment(orderId, kind, "card");
  }
  return NextResponse.json({ received: true });
}
