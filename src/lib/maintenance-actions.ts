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
  getService,
  myServiceRole,
  nextRequestNumber,
} from "@/lib/services";
import {
  MAINTENANCE_PRIORITIES,
  MAINTENANCE_STATUS_META,
  MAINTENANCE_OPEN_STATUSES,
} from "@/lib/services-meta";

type Session = Awaited<ReturnType<typeof requireApproved>>;

function actorName(session: Session) {
  return session.user.name ?? session.user.email ?? "مستخدم";
}

// ─────────────────────── access helpers ───────────────────────

async function loadRequest(id: string) {
  const req = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: { report: true, requester: { select: { fullName: true } } },
  });
  if (!req) throw new Error("الطلب غير موجود");
  return req;
}

// The viewer's relationship to a request (requester / team member / admin).
async function viewer(id: string, session: Session) {
  const req = await loadRequest(id);
  const isRequester = req.requesterId === session.user.id;
  const isAdmin = isPlatformAdmin(session);
  const memberRole = isAdmin ? "MANAGER" : await myServiceRole(req.serviceId, session.user.id);
  const isMember = isAdmin || Boolean(memberRole);
  if (!isRequester && !isMember) throw new Error("لا تملك صلاحية على هذا الطلب");
  // Who may act (assign aside): the assigned engineer, a manager, or admin.
  const canAct = isAdmin || memberRole === "MANAGER" || req.assignedEngineerId === session.user.id;
  return { req, isRequester, isMember, isAdmin, memberRole, canAct };
}

function assertOpen(status: string) {
  if (!MAINTENANCE_OPEN_STATUSES.includes(status)) throw new Error("الطلب مُغلق بالفعل");
}

async function notifyTeam(
  serviceId: string,
  event: "maintenance.requested" | "maintenance.acknowledged",
  data: Record<string, string | number>,
) {
  const members = await prisma.serviceMember.findMany({ where: { serviceId }, select: { userId: true } });
  await Promise.all(members.map((m) => dispatchNotification({ event, userId: m.userId, data })));
}

// Keep report.partsCost & totalCost in sync with the registered parts.
async function recomputeParts(tx: Prisma.TransactionClient, requestId: string) {
  const parts = await tx.maintenancePart.findMany({ where: { requestId }, select: { lineTotal: true } });
  const partsCost = parts.reduce((s, p) => s + Number(p.lineTotal), 0);
  const report = await tx.maintenanceReport.findUnique({ where: { requestId } });
  if (report) {
    await tx.maintenanceReport.update({
      where: { requestId },
      data: { partsCost, totalCost: Number(report.laborCost) + partsCost },
    });
  }
}

// ─────────────────────── create (doctor) ───────────────────────

const createSchema = z.object({
  deviceName: z.string().min(2, "حدّد الجهاز المعطّل").max(200),
  description: z.string().min(5, "صف العطل بإيجاز").max(2000),
  priority: z.enum(MAINTENANCE_PRIORITIES as [string, ...string[]]).default("MEDIUM"),
  mediaUrls: z.array(z.string().url()).max(20).optional(),
});

export async function createRequest(input: z.infer<typeof createSchema>): Promise<{ id: string }> {
  const session = await requirePermission("maintenance", "CREATE");
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  const service = await getService("MAINTENANCE");
  if (!service || !service.isActive || service.mode === "OFF") throw new Error("خدمة الصيانة غير متاحة");

  const requestNumber = await nextRequestNumber();
  const req = await prisma.maintenanceRequest.create({
    data: {
      requestNumber,
      serviceId: service.id,
      requesterId: session.user.id,
      deviceName: d.deviceName,
      description: d.description,
      priority: d.priority as never,
      status: "NEW",
      mediaUrls: d.mediaUrls ?? [],
    },
  });

  await recordAudit({ actorId: session.user.id, action: "maintenance.created", entityType: "MaintenanceRequest", entityId: req.id, metadata: { requestNumber } });
  await logActivity({ actorId: session.user.id, verb: "maintenance.requested", summary: `أنشأ طلب صيانة ${requestNumber}: ${d.deviceName}`, entityType: "MaintenanceRequest", entityId: req.id });
  await notifyTeam(service.id, "maintenance.requested", { no: requestNumber, device: d.deviceName });

  revalidatePath("/maintenance");
  return { id: req.id };
}

// ─────────────────────── assign engineer (team) ───────────────────────

export async function assignEngineer(requestId: string, engineerId: string): Promise<void> {
  const session = await requireApproved();
  const { req, isMember } = await viewer(requestId, session);
  if (!isMember) throw new Error("الإسناد من اختصاص فريق الصيانة");
  assertOpen(req.status);

  // The engineer must belong to the maintenance team.
  const role = await myServiceRole(req.serviceId, engineerId);
  if (!role) throw new Error("المهندس ليس عضواً في فريق الصيانة");
  const engineer = await prisma.user.findUnique({ where: { id: engineerId }, select: { fullName: true } });
  if (!engineer) throw new Error("المهندس غير موجود");

  await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: { assignedEngineerId: engineerId, status: req.status === "NEW" ? "ASSIGNED" : req.status },
  });

  await recordAudit({ actorId: session.user.id, action: "maintenance.assigned", entityType: "MaintenanceRequest", entityId: requestId, metadata: { engineerId } });
  await logActivity({ actorId: session.user.id, verb: "maintenance.assigned", summary: `أسند الطلب ${req.requestNumber} إلى ${engineer.fullName}`, entityType: "MaintenanceRequest", entityId: requestId });
  await dispatchNotification({ event: "maintenance.assigned", userId: engineerId, data: { no: req.requestNumber }, link: `/maintenance/${requestId}` });
  if (req.requesterId !== session.user.id) {
    await dispatchNotification({ event: "maintenance.statusChanged", userId: req.requesterId, data: { no: req.requestNumber, status: MAINTENANCE_STATUS_META.ASSIGNED.label }, link: `/maintenance/${requestId}` });
  }

  revalidatePath(`/maintenance/${requestId}`);
  revalidatePath("/maintenance");
}

// ─────────────────────── start work (engineer) ───────────────────────

export async function startWork(requestId: string): Promise<void> {
  const session = await requireApproved();
  const { req, canAct } = await viewer(requestId, session);
  if (!canAct) throw new Error("لا تملك صلاحية على هذا الطلب");
  if (req.status !== "ASSIGNED") throw new Error("يبدأ التنفيذ بعد الإسناد فقط");

  await prisma.maintenanceRequest.update({ where: { id: requestId }, data: { status: "IN_PROGRESS" } });

  await recordAudit({ actorId: session.user.id, action: "maintenance.started", entityType: "MaintenanceRequest", entityId: requestId });
  await logActivity({ actorId: session.user.id, verb: "maintenance.started", summary: `بدأ تنفيذ الطلب ${req.requestNumber}`, entityType: "MaintenanceRequest", entityId: requestId });
  await dispatchNotification({ event: "maintenance.statusChanged", userId: req.requesterId, data: { no: req.requestNumber, status: MAINTENANCE_STATUS_META.IN_PROGRESS.label }, link: `/maintenance/${requestId}` });

  revalidatePath(`/maintenance/${requestId}`);
  revalidatePath("/maintenance");
}

// ─────────────────────── visits (engineer) ───────────────────────

const visitSchema = z.object({
  requestId: z.string().min(1),
  visitDate: z.string().min(1, "تاريخ الزيارة مطلوب"),
  notes: z.string().max(1000).optional(),
});

export async function addVisit(input: z.infer<typeof visitSchema>): Promise<void> {
  const session = await requireApproved();
  const parsed = visitSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const v = parsed.data;
  const { req, canAct } = await viewer(v.requestId, session);
  if (!canAct) throw new Error("لا تملك صلاحية على هذا الطلب");
  if (!["IN_PROGRESS", "AWAITING_CLOSURE"].includes(req.status)) throw new Error("تُسجَّل الزيارات أثناء التنفيذ");

  await prisma.maintenanceVisit.create({
    data: {
      requestId: v.requestId,
      engineerId: session.user.id,
      engineerName: actorName(session),
      visitDate: new Date(v.visitDate),
      notes: v.notes || null,
    },
  });

  await logActivity({ actorId: session.user.id, verb: "maintenance.visit", summary: `سجّل زيارة للطلب ${req.requestNumber}`, entityType: "MaintenanceRequest", entityId: v.requestId });
  revalidatePath(`/maintenance/${v.requestId}`);
}

// ─────────────────────── parts (registration only) ───────────────────────

export async function addPart(requestId: string, catalogItemId: string, quantity: number): Promise<void> {
  const session = await requireApproved();
  const { req, canAct } = await viewer(requestId, session);
  if (!canAct) throw new Error("لا تملك صلاحية على هذا الطلب");
  if (!["IN_PROGRESS", "AWAITING_CLOSURE"].includes(req.status)) throw new Error("تُربط القطع أثناء التنفيذ");
  const qty = Math.max(1, Math.floor(quantity));

  // Pull the part from the market catalog for its price snapshot. No stock
  // deduction and no separate market transaction — counted into totalCost only.
  const item = await prisma.catalogItem.findUnique({ where: { id: catalogItemId } });
  if (!item) throw new Error("القطعة غير موجودة في الكتالوج");
  const unitPrice = Number(item.priceNormal);
  const lineTotal = unitPrice * qty;

  await prisma.$transaction(async (tx) => {
    await tx.maintenancePart.create({
      data: { requestId, catalogItemId: item.id, name: item.name, quantity: qty, unitPrice, lineTotal },
    });
    await recomputeParts(tx, requestId);
  });

  await logActivity({ actorId: session.user.id, verb: "maintenance.partAdded", summary: `ربط قطعة (${item.name} ×${qty}) بالطلب ${req.requestNumber}`, entityType: "MaintenanceRequest", entityId: requestId });
  revalidatePath(`/maintenance/${requestId}`);
}

export async function removePart(partId: string): Promise<void> {
  const session = await requireApproved();
  const part = await prisma.maintenancePart.findUnique({ where: { id: partId } });
  if (!part) throw new Error("القطعة غير موجودة");
  const { req, canAct } = await viewer(part.requestId, session);
  if (!canAct) throw new Error("لا تملك صلاحية على هذا الطلب");
  if (!["IN_PROGRESS", "AWAITING_CLOSURE"].includes(req.status)) throw new Error("لا يمكن تعديل القطع الآن");

  await prisma.$transaction(async (tx) => {
    await tx.maintenancePart.delete({ where: { id: partId } });
    await recomputeParts(tx, part.requestId);
  });
  revalidatePath(`/maintenance/${part.requestId}`);
}

// ─────────────────────── report → awaiting closure (engineer) ───────────────────────

const reportSchema = z.object({
  requestId: z.string().min(1),
  diagnosis: z.string().min(3, "اكتب التشخيص").max(4000),
  laborCost: z.coerce.number().min(0).default(0),
});

export async function saveReport(input: z.infer<typeof reportSchema>): Promise<void> {
  const session = await requireApproved();
  const parsed = reportSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const r = parsed.data;
  const { req, canAct } = await viewer(r.requestId, session);
  if (!canAct) throw new Error("لا تملك صلاحية على هذا الطلب");
  if (!["IN_PROGRESS", "AWAITING_CLOSURE"].includes(req.status)) throw new Error("يُكتب التقرير أثناء التنفيذ");

  // partsCost is derived from registered parts; totalCost = labor + parts.
  const parts = await prisma.maintenancePart.findMany({ where: { requestId: r.requestId }, select: { lineTotal: true } });
  const partsCost = parts.reduce((s, p) => s + Number(p.lineTotal), 0);
  const totalCost = r.laborCost + partsCost;
  const name = actorName(session);

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceReport.upsert({
      where: { requestId: r.requestId },
      update: { diagnosis: r.diagnosis, laborCost: r.laborCost, partsCost, totalCost, authorId: session.user.id, authorName: name },
      create: { requestId: r.requestId, diagnosis: r.diagnosis, laborCost: r.laborCost, partsCost, totalCost, authorId: session.user.id, authorName: name },
    });
    // Re-opening the report after acknowledgement invalidates that acknowledgement.
    await tx.maintenanceRequest.update({ where: { id: r.requestId }, data: { status: "AWAITING_CLOSURE", acknowledgedAt: null } });
  });

  await recordAudit({ actorId: session.user.id, action: "maintenance.report", entityType: "MaintenanceRequest", entityId: r.requestId, metadata: { totalCost } });
  await logActivity({ actorId: session.user.id, verb: "maintenance.report", summary: `حفظ تقرير الطلب ${req.requestNumber} (الإجمالي ${formatIQD(totalCost)})`, entityType: "MaintenanceRequest", entityId: r.requestId });
  await dispatchNotification({ event: "maintenance.reportReady", userId: req.requesterId, data: { no: req.requestNumber, amount: formatIQD(totalCost) }, link: `/maintenance/${r.requestId}` });

  revalidatePath(`/maintenance/${r.requestId}`);
  revalidatePath("/maintenance");
}

// ─────────────────────── acknowledge cost (doctor — transparency only) ───────────────────────

export async function acknowledgeCost(requestId: string): Promise<void> {
  const session = await requireApproved();
  const { req, isRequester } = await viewer(requestId, session);
  if (!isRequester) throw new Error("الإقرار من حقّ صاحب الطلب فقط");
  if (req.status !== "AWAITING_CLOSURE") throw new Error("لا يوجد تقرير بانتظار الإقرار");
  if (req.acknowledgedAt) return;

  await prisma.maintenanceRequest.update({ where: { id: requestId }, data: { acknowledgedAt: new Date() } });

  await recordAudit({ actorId: session.user.id, action: "maintenance.acknowledged", entityType: "MaintenanceRequest", entityId: requestId });
  await logActivity({ actorId: session.user.id, verb: "maintenance.acknowledged", summary: `أقرّ بتكلفة الطلب ${req.requestNumber}`, entityType: "MaintenanceRequest", entityId: requestId });
  await notifyTeam(req.serviceId, "maintenance.acknowledged", { no: req.requestNumber });

  revalidatePath(`/maintenance/${requestId}`);
}

// ─────────────────────── complete → document transaction (team) ───────────────────────

export async function completeRequest(requestId: string): Promise<void> {
  const session = await requireApproved();
  const { req, canAct } = await viewer(requestId, session);
  if (!canAct) throw new Error("الإنهاء من اختصاص فريق الصيانة");
  if (req.status !== "AWAITING_CLOSURE") throw new Error("يُنهى الطلب بعد كتابة التقرير");
  if (!req.acknowledgedAt) throw new Error("بانتظار إقرار العميل بالتكلفة قبل الإنهاء");
  if (!req.report) throw new Error("لا يوجد تقرير لهذا الطلب");

  const totalCost = Number(req.report.totalCost);
  const service = await prisma.service.findUnique({ where: { id: req.serviceId }, select: { name: true } });

  await prisma.$transaction(async (tx) => {
    await tx.maintenanceRequest.update({ where: { id: requestId }, data: { status: "COMPLETED", completedAt: new Date() } });
    // Document the maintenance deal for the admin (amount = totalCost, no commission math).
    await tx.partnerTransaction.create({
      data: {
        type: "MAINTENANCE",
        serviceId: req.serviceId,
        serviceName: service?.name ?? "الصيانة",
        requesterId: req.requesterId,
        requesterName: req.requester.fullName,
        referenceId: req.requestNumber,
        serviceLabel: `صيانة: ${req.deviceName}`,
        tier: null,
        agreedAmount: totalCost,
        status: "COMPLETED",
      },
    });
  });

  await recordAudit({ actorId: session.user.id, action: "maintenance.completed", entityType: "MaintenanceRequest", entityId: requestId, metadata: { totalCost } });
  await logActivity({ actorId: session.user.id, verb: "maintenance.completed", summary: `أنهى الطلب ${req.requestNumber} (الإجمالي ${formatIQD(totalCost)})`, entityType: "MaintenanceRequest", entityId: requestId });
  await dispatchNotification({ event: "maintenance.completed", userId: req.requesterId, data: { no: req.requestNumber, amount: formatIQD(totalCost) }, link: `/maintenance/${requestId}` });

  revalidatePath(`/maintenance/${requestId}`);
  revalidatePath("/maintenance");
  revalidatePath("/admin/transactions");
}

// ─────────────────────── cancel (requester or team, any open state) ───────────────────────

export async function cancelRequest(requestId: string, reason?: string): Promise<void> {
  const session = await requireApproved();
  const { req, isRequester, isMember } = await viewer(requestId, session);
  if (!isRequester && !isMember) throw new Error("لا تملك صلاحية على هذا الطلب");
  assertOpen(req.status);

  await prisma.maintenanceRequest.update({
    where: { id: requestId },
    data: { status: "CANCELLED", cancelledById: session.user.id, cancelReason: reason || "أُلغي" },
  });

  await recordAudit({ actorId: session.user.id, action: "maintenance.cancelled", entityType: "MaintenanceRequest", entityId: requestId, metadata: { reason } });
  await logActivity({ actorId: session.user.id, verb: "maintenance.cancelled", summary: `ألغى الطلب ${req.requestNumber}`, entityType: "MaintenanceRequest", entityId: requestId });
  if (isRequester) {
    await notifyTeam(req.serviceId, "maintenance.acknowledged", { no: req.requestNumber });
  } else {
    await dispatchNotification({ event: "maintenance.statusChanged", userId: req.requesterId, data: { no: req.requestNumber, status: MAINTENANCE_STATUS_META.CANCELLED.label }, link: `/maintenance/${requestId}` });
  }

  revalidatePath(`/maintenance/${requestId}`);
  revalidatePath("/maintenance");
}
