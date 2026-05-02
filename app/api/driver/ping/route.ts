import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getLocationProvider } from "@/lib/shipments/locationProvider";

const pingSchema = z.object({
  token: z.string().min(8),
  lat: z.number().gte(-90).lte(90),
  lng: z.number().gte(-180).lte(180),
});

export async function POST(req: Request) {
  let body: unknown;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "invalid json" }, { status: 400 }); }
  const parsed = pingSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  const shipment = await prisma.shipment.findUnique({ where: { trackingToken: parsed.data.token } });
  if (!shipment) return NextResponse.json({ error: "not found" }, { status: 404 });
  if (shipment.status === "DELIVERED" || shipment.status === "CANCELLED") {
    return NextResponse.json({ error: "shipment closed" }, { status: 400 });
  }

  await getLocationProvider().recordPing(shipment.id, parsed.data.lat, parsed.data.lng);
  return NextResponse.json({ ok: true });
}
