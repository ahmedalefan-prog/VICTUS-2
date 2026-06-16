import { prisma } from "@/lib/prisma";

// ─────────────────────── Notification Engine ───────────────────────
// Central typed event catalog. Every part of VICTUS dispatches through
// `dispatchNotification` so titles/bodies stay consistent and channel
// preferences are respected. In-app is active; email/SMS are foundation channels.

type NotifType = "SYSTEM" | "ACCOUNT" | "MAINTENANCE" | "ORDER" | "JOB" | "GENERAL";

interface EventDef {
  type: NotifType;
  title: string;
  body?: (data: Record<string, string | number>) => string;
  link?: string;
}

export const NOTIFICATION_EVENTS = {
  "account.registered": {
    type: "ACCOUNT",
    title: "تم استلام طلب تسجيلك",
    body: () => "حسابك قيد المراجعة من إدارة المنصة. سيتم إشعارك عند الموافقة.",
  },
  "account.approved": {
    type: "ACCOUNT",
    title: "تمت الموافقة على حسابك",
    body: () => "مرحباً بك في VICTUS. يمكنك الآن الوصول إلى لوحة التحكم.",
    link: "/dashboard",
  },
  "account.rejected": {
    type: "ACCOUNT",
    title: "تم رفض حسابك",
    body: (d) => (d.note ? String(d.note) : "لم تتم الموافقة على حسابك."),
  },
  "account.statusChanged": {
    type: "ACCOUNT",
    title: "تم تحديث حالة حسابك",
    body: (d) => `الحالة الجديدة: ${d.status}`,
  },
  // ─── service orders (lab / market) ───
  "order.received": {
    type: "ORDER",
    title: "طلب جديد من عميل",
    body: (d) => `طلب ${d.no} بقيمة ${d.amount}`,
    link: "/console",
  },
  "order.negotiation": {
    type: "ORDER",
    title: "تحديث في التفاوض",
    body: (d) => `طلب ${d.no}: ${d.action}`,
  },
  "order.statusChanged": {
    type: "ORDER",
    title: "تحديث حالة الطلب",
    body: (d) => `طلب ${d.no} أصبح: ${d.status}`,
  },
  "order.cancelled": {
    type: "ORDER",
    title: "تم إلغاء الطلب",
    body: (d) => `طلب ${d.no} أُلغي`,
  },
  // ─── maintenance ───
  "maintenance.requested": {
    type: "MAINTENANCE",
    title: "طلب صيانة جديد",
    body: (d) => `طلب صيانة ${d.no}`,
    link: "/maintenance/console",
  },
  "maintenance.assigned": {
    type: "MAINTENANCE",
    title: "تم إسناد طلب صيانة إليك",
    body: (d) => `طلب ${d.no}`,
  },
  "maintenance.statusChanged": {
    type: "MAINTENANCE",
    title: "تحديث على طلب الصيانة",
    body: (d) => `طلب ${d.no} أصبح: ${d.status}`,
  },
  // ─── jobs ───
  "job.applicationReceived": {
    type: "JOB",
    title: "طلب توظيف جديد",
    body: (d) => `${d.name} تقدّم لوظيفة: ${d.job}`,
  },
  "application.statusChanged": {
    type: "JOB",
    title: "تحديث على طلب التوظيف",
    body: (d) => `طلبك لوظيفة ${d.job} أصبح: ${d.status}`,
  },
  // ─── service membership ───
  "service.assigned": {
    type: "SYSTEM",
    title: "تم تعيينك في فريق خدمة",
    body: (d) => `أصبحت عضواً في: ${d.service}`,
    link: "/console",
  },
} satisfies Record<string, EventDef>;

export type NotificationEventKey = keyof typeof NOTIFICATION_EVENTS;

interface DispatchInput {
  event: NotificationEventKey;
  userId: string;
  data?: Record<string, string | number>;
  link?: string;
}

export async function dispatchNotification({ event, userId, data = {}, link }: DispatchInput) {
  const def: EventDef = NOTIFICATION_EVENTS[event];
  if (!def) return;
  try {
    const pref = await prisma.notificationPreference.findUnique({
      where: { userId_type: { userId, type: def.type } },
    });
    const inApp = pref?.inApp ?? true;
    if (inApp) {
      await prisma.notification.create({
        data: {
          userId,
          type: def.type,
          event,
          channel: "IN_APP",
          title: def.title,
          body: def.body?.(data),
          link: link ?? def.link,
        },
      });
    }
  } catch (e) {
    console.error("dispatchNotification failed:", e);
  }
}

export async function notifyAdHoc(input: {
  userId: string;
  type?: NotifType;
  title: string;
  body?: string;
  link?: string;
}) {
  try {
    await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type ?? "GENERAL",
        title: input.title,
        body: input.body,
        link: input.link,
        channel: "IN_APP",
      },
    });
  } catch (e) {
    console.error("notifyAdHoc failed:", e);
  }
}
