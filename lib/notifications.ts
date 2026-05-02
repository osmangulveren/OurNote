import { NotificationType, Prisma } from "@prisma/client";

type Notifier = {
  notification: {
    create: (args: any) => Promise<any>;
    findMany: (args: any) => Promise<any[]>;
    updateMany: (args: any) => Promise<any>;
    count: (args: any) => Promise<number>;
  };
};

export async function notify(
  prisma: Notifier,
  userId: string,
  args: { type: NotificationType; title: string; body?: string; link?: string },
) {
  return prisma.notification.create({
    data: {
      userId,
      type: args.type,
      title: args.title,
      body: args.body,
      link: args.link,
    },
  });
}

export async function unreadCount(prisma: Notifier, userId: string) {
  return prisma.notification.count({
    where: { userId, readAt: null } as Prisma.NotificationWhereInput,
  });
}

export async function markAllRead(prisma: Notifier, userId: string) {
  return prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
