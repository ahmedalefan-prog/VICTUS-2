import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { NotificationsClient } from "./client";

export const metadata = { title: "الإشعارات" };

export default async function NotificationsPage() {
  const session = await requirePermission("notifications", "VIEW");

  const [notifications, totalCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        body: true,
        link: true,
        type: true,
        createdAt: true,
        readAt: true,
      },
    }),
    prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
  ]);

  return (
    <NotificationsClient
      initialNotifications={notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() ?? null,
      }))}
      initialUnread={totalCount}
    />
  );
}
