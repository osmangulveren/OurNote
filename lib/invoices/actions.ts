"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { sendToEInvoice } from "@/lib/invoices/eInvoiceAdapter";

function generateInvoiceNumber() {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `TASLAK-${stamp}-${rand}`;
}

export async function createInvoiceDraft(orderId: string) {
  await requireAdmin();

  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) return { error: "Sipariş bulunamadı." };

  const existing = await prisma.invoiceDraft.findUnique({ where: { orderId } });
  if (existing) {
    redirect(`/invoices/${existing.id}`);
  }

  const invoice = await prisma.invoiceDraft.create({
    data: {
      invoiceNumber: generateInvoiceNumber(),
      orderId: order.id,
      customerId: order.userId,
      subtotal: order.subtotal,
      vatTotal: order.vatTotal,
      grandTotal: order.grandTotal,
      status: "DRAFT",
    },
  });

  revalidatePath(`/admin/orders/${orderId}`);
  redirect(`/invoices/${invoice.id}`);
}

export async function markInvoiceReadyForAccounting(invoiceId: string) {
  await requireAdmin();

  const invoice = await prisma.invoiceDraft.update({
    where: { id: invoiceId },
    data: { status: "READY_FOR_ACCOUNTING" },
  });

  // E-Fatura entegrasyon noktası — şimdilik stub.
  await sendToEInvoice(invoice.id);

  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/admin/accounting");
  return { ok: true };
}
