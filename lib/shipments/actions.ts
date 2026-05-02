"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

const shipmentSchema = z.object({
  truckPlate: z.string().trim().min(2).max(20),
  driverName: z.string().trim().min(2).max(120),
  driverPhone: z.string().trim().max(40).optional().or(z.literal("")),
  etaAt: z.string().trim().optional().or(z.literal("")),
});

export type ShipmentFormState = { error?: string; ok?: boolean };

export async function upsertShipment(orderId: string, _: ShipmentFormState, form: FormData): Promise<ShipmentFormState> {
  const session = await requireAdmin();
  const parsed = shipmentSchema.safeParse({
    truckPlate: form.get("truckPlate"),
    driverName: form.get("driverName"),
    driverPhone: form.get("driverPhone") ?? "",
    etaAt: form.get("etaAt") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Geçersiz veri" };
  const data = parsed.data;
  const eta = data.etaAt ? new Date(data.etaAt) : null;
  if (eta && isNaN(eta.getTime())) return { error: "Geçersiz tahmini varış tarihi." };

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Sipariş bulunamadı." };

  await prisma.shipment.upsert({
    where: { orderId },
    update: {
      truckPlate: data.truckPlate,
      driverName: data.driverName,
      driverPhone: data.driverPhone || null,
      etaAt: eta,
    },
    create: {
      orderId,
      truckPlate: data.truckPlate,
      driverName: data.driverName,
      driverPhone: data.driverPhone || null,
      etaAt: eta,
    },
  });

  await logAudit(prisma, {
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "SHIPMENT_UPSERT",
    entityType: "Shipment",
    entityId: orderId,
    payload: { truckPlate: data.truckPlate, driverName: data.driverName },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath(`/customer/orders/${orderId}`);
  return { ok: true };
}
