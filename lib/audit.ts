import { Prisma } from "@prisma/client";

type AuditWriter = {
  auditLog: { create: (args: any) => Promise<any> };
};

interface LogArgs {
  userId?: string | null;
  actorEmail?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: Prisma.InputJsonValue;
}

export async function logAudit(prisma: AuditWriter, args: LogArgs) {
  return prisma.auditLog.create({
    data: {
      userId: args.userId ?? null,
      actorEmail: args.actorEmail ?? null,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId ?? null,
      payload: args.payload ?? Prisma.JsonNull,
    },
  });
}
