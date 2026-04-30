"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/session";
import { D } from "@/lib/money";

const profileSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  taxNumber: z.string().trim().max(40).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  discountPercentage: z.coerce.number().min(0).max(100),
});

export type CustomerProfileState = { error?: string; ok?: boolean };

export async function updateCustomerProfile(
  userId: string,
  _: CustomerProfileState,
  form: FormData,
): Promise<CustomerProfileState> {
  await requireAdmin();
  const parsed = profileSchema.safeParse({
    companyName: form.get("companyName"),
    taxNumber: form.get("taxNumber") ?? "",
    phone: form.get("phone") ?? "",
    address: form.get("address") ?? "",
    discountPercentage: form.get("discountPercentage"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Geçersiz veri" };
  const data = parsed.data;

  await prisma.customerProfile.upsert({
    where: { userId },
    update: {
      companyName: data.companyName,
      taxNumber: data.taxNumber || null,
      phone: data.phone || null,
      address: data.address || null,
      discountPercentage: new D(data.discountPercentage),
    },
    create: {
      userId,
      companyName: data.companyName,
      taxNumber: data.taxNumber || null,
      phone: data.phone || null,
      address: data.address || null,
      discountPercentage: new D(data.discountPercentage),
    },
  });

  revalidatePath(`/admin/customers/${userId}`);
  revalidatePath("/admin/customers");
  return { ok: true };
}

export async function setCustomerProductPrice(customerId: string, productId: string, priceText: string) {
  await requireAdmin();
  const trimmed = priceText.trim();

  if (trimmed === "") {
    await prisma.customerProductPrice.deleteMany({ where: { customerId, productId } });
  } else {
    const num = Number(trimmed);
    if (!isFinite(num) || num < 0) return { error: "Geçersiz fiyat." };
    await prisma.customerProductPrice.upsert({
      where: { customerId_productId: { customerId, productId } },
      update: { price: new D(num) },
      create: { customerId, productId, price: new D(num) },
    });
  }
  revalidatePath(`/admin/customers/${customerId}`);
  return { ok: true };
}
