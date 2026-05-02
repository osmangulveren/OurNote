"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

function generateNoteNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `IRS-${stamp}-${rand}`;
}

export async function createDeliveryNote(orderId: string) {
  const session = await requireAdmin();

  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: true, shipment: true },
  });
  if (!order) return { error: "Sipariş bulunamadı." };

  const existing = await prisma.deliveryNoteDraft.findUnique({ where: { orderId } });
  if (existing) {
    redirect(`/delivery-notes/${existing.id}`);
  }

  const totalQuantity = order.items.reduce((s, i) => s + i.quantity, 0);

  const note = await prisma.deliveryNoteDraft.create({
    data: {
      noteNumber: generateNoteNumber(),
      orderId,
      shipmentId: order.shipment?.id,
      carrierPlate: order.shipment?.truckPlate,
      carrierDriver: order.shipment?.driverName,
      totalLineCount: order.items.length,
      totalQuantity,
    },
  });

  await logAudit(prisma, {
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "DELIVERY_NOTE_CREATE",
    entityType: "DeliveryNoteDraft",
    entityId: note.id,
    payload: { noteNumber: note.noteNumber, orderId },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/delivery-notes/${note.id}`);
}
