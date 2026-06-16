"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma";
import { prisma } from "@/lib/prisma";
import { requireApproved, requirePermission, isPlatformAdmin } from "@/lib/guard";
import { recordAudit, logActivity } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications";
import { formatIQD } from "@/lib/format";
import {
  SERVICE_TYPE_META,
  nextOrderNumber,
  myServiceRole,
  serviceLabelFor,
  uniformTier,
  FULFILLMENT_TRANSITIONS,
  FULFILLMENT_STATUS_META,
} from "@/lib/services";

type Session = Awaited<ReturnType<typeof requireApproved>>;

// ─────────────────────── shared helpers ───────────────────────

async function viewerContext(orderId: string, session: Session) {
  const order = await prisma.serviceOrder.findUnique({
    where: { id: orderId },
    include: { items: true, service: { select: { name: true } } },
  });
  if (!order) throw new Error("الطلب غير موجود");
  const isRequester = order.requesterId === session.user.id;
  const isAdmin = isPlatformAdmin(session);
  const memberRole = isAdmin ? null : await myServiceRole(order.serviceId, session.user.id);
  const isMember = isAdmin || Boolean(memberRole);
  if (!isRequester && !isMember) throw new Error("لا تملك صلاحية على هذا الطلب");
  return { order, isRequester, isMember, isAdmin };
}

function actorName(session: Session) {
  return session.user.name ?? session.user.email ?? "مستخدم";
}

// Document the agreed deal for the admin (no commission math — amount only).
async function createTransaction(
  tx: Prisma.TransactionClient,
  order: { orderNumber: string; serviceType: string; serviceId: string; requesterId: string },
  serviceName: string,
  requesterName: string,
  serviceLabel: string,
  tier: "NORMAL" | "VIP" | null,
  amount: number,
) {
  await tx.partnerTransaction.create({
    data: {
      type: order.serviceType as never,
      serviceId: order.serviceId,
      serviceName,
      requesterId: order.requesterId,
      requesterName,
      referenceId: order.orderNumber,
      serviceLabel,
      tier: tier as never,
      agreedAmount: amount,
      status: "AGREED",
    },
  });
}

async function notifyServiceMembers(
  serviceId: string,
  event: "order.received" | "order.cancelled",
  data: Record<string, string | number>,
) {
  const members = await prisma.serviceMember.findMany({
    where: { serviceId },
    select: { userId: true },
  });
  await Promise.all(members.map((m) => dispatchNotification({ event, userId: m.userId, data })));
}

// ─────────────────────── create order (cart → order at listed price) ───────────────────────

const lineSchema = z.object({
  catalogItemId: z.string().min(1),
  tier: z.enum(["NORMAL", "VIP"]),
  quantity: z.number().int().min(1).max(9999),
  teeth: z.array(z.number().int().min(11).max(48)).optional(),
  shade: z.string().max(20).optional(),
  itemNotes: z.string().max(1000).optional(),
});

const createSchema = z.object({
  serviceType: z.enum(["LAB", "MARKET", "MAINTENANCE"]),
  note: z.string().max(2000).optional(),
  caseFiles: z.array(z.string().url()).max(20).optional(),
  lines: z.array(lineSchema).min(1, "السلة فارغة"),
});

export async function createOrder(input: z.infer<typeof createSchema>): Promise<{ id: string }> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  // Access: ordering is for requesters (clinics/doctors) — enforced server-side.
  const resource = SERVICE_TYPE_META[d.serviceType].resource;
  const session = await requirePermission(resource, "CREATE");

  const service = await prisma.service.findUnique({ where: { type: d.serviceType } });
  if (!service || !service.isActive || service.mode === "OFF") throw new Error("الخدمة غير متاحة");

  const catalogItems = await prisma.catalogItem.findMany({
    where: { id: { in: d.lines.map((l) => l.catalogItemId) }, serviceId: service.id, isActive: true },
  });
  const byId = new Map(catalogItems.map((c) => [c.id, c]));

  const itemData = d.lines.map((l) => {
    const ci = byId.get(l.catalogItemId);
    if (!ci) throw new Error("أحد العناصر لم يعد متاحاً");
    const vip = l.tier === "VIP" && ci.priceVip !== null;
    const unit = Number(vip ? ci.priceVip : ci.priceNormal);
    // Lab manufacturing: units = number of selected teeth (when provided).
    const teeth = l.teeth ?? [];
    const quantity = teeth.length > 0 ? teeth.length : l.quantity;
    return { catalogItemId: ci.id, name: ci.name, tier: l.tier, quantity, listedPrice: unit, teeth, shade: l.shade || null, itemNotes: l.itemNotes || null };
  });
  const listedTotal = itemData.reduce((s, it) => s + it.listedPrice * it.quantity, 0);

  const orderNumber = await nextOrderNumber();
  const name = actorName(session);
  const tier = uniformTier(itemData);
  const label = serviceLabelFor(itemData);

  const created = await prisma.$transaction(async (tx) => {
    const order = await tx.serviceOrder.create({
      data: {
        orderNumber,
        serviceId: service.id,
        serviceType: d.serviceType as never,
        requesterId: session.user.id,
        note: d.note || null,
        caseFiles: d.caseFiles ?? [],
        fulfillmentStatus: "NEW",
        agreedTotal: listedTotal,
        items: {
          create: itemData.map((it) => ({
            catalogItemId: it.catalogItemId,
            name: it.name,
            tier: it.tier as never,
            quantity: it.quantity,
            teeth: it.teeth,
            shade: it.shade,
            itemNotes: it.itemNotes,
            listedPrice: it.listedPrice,
          })),
        },
      },
    });

    await createTransaction(tx, order, service.name, name, label, tier, listedTotal);
    return order;
  });

  await recordAudit({ actorId: session.user.id, action: "order.created", entityType: "ServiceOrder", entityId: created.id, metadata: { orderNumber } });
  await logActivity({ actorId: session.user.id, verb: "order.created", summary: `أنشأ طلباً ${orderNumber} لدى ${service.name}`, entityType: "ServiceOrder", entityId: created.id });
  await notifyServiceMembers(service.id, "order.received", { no: orderNumber, amount: formatIQD(listedTotal) });

  revalidatePath(`/${resource}/orders`);
  revalidatePath("/console");
  return { id: created.id };
}

// ─────────────────────── fulfilment ───────────────────────

export async function setFulfillmentStatus(orderId: string, status: string): Promise<void> {
  const session = await requireApproved();
  const { order, isMember } = await viewerContext(orderId, session);
  if (!isMember) throw new Error("تغيير حالة التنفيذ من اختصاص فريق الخدمة");

  const allowed = FULFILLMENT_TRANSITIONS[order.fulfillmentStatus] ?? [];
  if (!allowed.includes(status)) throw new Error("انتقال حالة غير مسموح");

  await prisma.$transaction(async (tx) => {
    await tx.serviceOrder.update({ where: { id: order.id }, data: { fulfillmentStatus: status as never } });
    if (status === "COMPLETED" || status === "CANCELLED") {
      await tx.partnerTransaction.updateMany({
        where: { referenceId: order.orderNumber },
        data: { status: status === "COMPLETED" ? "COMPLETED" : "CANCELLED" },
      });
    }
    if (status === "CANCELLED") {
      await tx.serviceOrder.update({ where: { id: order.id }, data: { cancelledById: session.user.id } });
    }
  });

  await recordAudit({ actorId: session.user.id, action: "order.fulfillment", entityType: "ServiceOrder", entityId: order.id, metadata: { status } });
  await logActivity({ actorId: session.user.id, verb: "order.fulfillment", summary: `طلب ${order.orderNumber}: ${FULFILLMENT_STATUS_META[status]?.label ?? status}`, entityType: "ServiceOrder", entityId: order.id });
  await dispatchNotification({ event: "order.statusChanged", userId: order.requesterId, data: { no: order.orderNumber, status: FULFILLMENT_STATUS_META[status]?.label ?? status } });

  const resource = SERVICE_TYPE_META[order.serviceType].resource;
  revalidatePath(`/${resource}/orders/${order.id}`);
  revalidatePath("/console");
}

// ─────────────────────── lab rating (doctor rates a completed order) ───────────────────────

const ratingSchema = z.object({
  orderId: z.string().min(1),
  quality: z.number().int().min(1).max(5),
  speed: z.number().int().min(1).max(5),
  commitment: z.number().int().min(1).max(5),
  comment: z.string().max(1000).optional(),
});

export async function rateLabOrder(input: z.infer<typeof ratingSchema>): Promise<void> {
  const session = await requireApproved();
  const parsed = ratingSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  const order = await prisma.serviceOrder.findUnique({
    where: { id: d.orderId },
    select: { requesterId: true, serviceId: true, serviceType: true, fulfillmentStatus: true, rating: { select: { id: true } } },
  });
  if (!order) throw new Error("الطلب غير موجود");
  if (order.requesterId !== session.user.id) throw new Error("التقييم من حقّ صاحب الطلب فقط");
  if (order.fulfillmentStatus !== "COMPLETED") throw new Error("يمكن التقييم بعد اكتمال الطلب");
  if (order.rating) throw new Error("سبق تقييم هذا الطلب");

  await prisma.labRating.create({
    data: {
      orderId: d.orderId,
      serviceId: order.serviceId,
      raterId: session.user.id,
      quality: d.quality,
      speed: d.speed,
      commitment: d.commitment,
      comment: d.comment || null,
    },
  });
  await logActivity({ actorId: session.user.id, verb: "lab.rated", summary: "قيّم طلب مختبر", entityType: "ServiceOrder", entityId: d.orderId });
  revalidatePath(`/lab/orders/${d.orderId}`);
}

// ─────────────────────── cancel (requester / member / admin) ───────────────────────

export async function cancelOrder(orderId: string, reason?: string): Promise<void> {
  const session = await requireApproved();
  const { order } = await viewerContext(orderId, session);
  if (["COMPLETED", "CANCELLED"].includes(order.fulfillmentStatus)) {
    throw new Error("الطلب مُغلق بالفعل");
  }

  await prisma.$transaction(async (tx) => {
    await tx.serviceOrder.update({
      where: { id: order.id },
      data: {
        fulfillmentStatus: "CANCELLED",
        cancelledById: session.user.id,
        cancelReason: reason || "أُلغي",
      },
    });
    await tx.partnerTransaction.updateMany({ where: { referenceId: order.orderNumber }, data: { status: "CANCELLED" } });
  });

  await recordAudit({ actorId: session.user.id, action: "order.cancelled", entityType: "ServiceOrder", entityId: order.id, metadata: { reason } });
  await logActivity({ actorId: session.user.id, verb: "order.cancelled", summary: `ألغى الطلب ${order.orderNumber}`, entityType: "ServiceOrder", entityId: order.id });

  if (order.requesterId !== session.user.id) {
    await dispatchNotification({ event: "order.cancelled", userId: order.requesterId, data: { no: order.orderNumber } });
  } else {
    await notifyServiceMembers(order.serviceId, "order.cancelled", { no: order.orderNumber });
  }

  const resource = SERVICE_TYPE_META[order.serviceType].resource;
  revalidatePath(`/${resource}/orders/${order.id}`);
  revalidatePath("/console");
}
