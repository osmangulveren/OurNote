"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/session";
import { logAudit } from "@/lib/audit";

const createSchema = z.object({
  email: z.string().email(),
  name: z.string().trim().min(2).max(120),
  role: z.nativeEnum(Role),
  password: z.string().min(6).max(120),
});

export type AdminUserState = { error?: string; ok?: boolean };

export async function createAdminUser(_: AdminUserState, form: FormData): Promise<AdminUserState> {
  const session = await requirePermission("users.manage");
  const parsed = createSchema.safeParse({
    email: form.get("email"),
    name: form.get("name"),
    role: form.get("role"),
    password: form.get("password"),
  });
  if (!parsed.success) return { error: parsed.error.errors[0]?.message ?? "Geçersiz veri" };
  if (parsed.data.role === "CUSTOMER") return { error: "Bu form sadece personel rolleri içindir." };

  const exists = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase() } });
  if (exists) return { error: "Bu email zaten kayıtlı." };

  const created = await prisma.user.create({
    data: {
      email: parsed.data.email.toLowerCase(),
      name: parsed.data.name,
      role: parsed.data.role,
      passwordHash: await bcrypt.hash(parsed.data.password, 10),
    },
  });

  await logAudit(prisma, {
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "USER_CREATE",
    entityType: "User",
    entityId: created.id,
    payload: { email: created.email, role: created.role },
  });

  revalidatePath("/admin/users");
  return { ok: true };
}

export async function updateAdminUserRole(targetUserId: string, role: Role) {
  const session = await requirePermission("users.manage");
  if (role === "CUSTOMER") throw new Error("Personel rolü gerekli.");
  const target = await prisma.user.findUnique({ where: { id: targetUserId } });
  if (!target) throw new Error("Kullanıcı bulunamadı.");
  if (target.role === "CUSTOMER") throw new Error("Müşteri kayıtları bu sayfadan değiştirilemez.");
  await prisma.user.update({ where: { id: targetUserId }, data: { role } });
  await logAudit(prisma, {
    userId: session.user.id,
    actorEmail: session.user.email,
    action: "USER_ROLE_CHANGE",
    entityType: "User",
    entityId: targetUserId,
    payload: { from: target.role, to: role },
  });
  revalidatePath("/admin/users");
}
