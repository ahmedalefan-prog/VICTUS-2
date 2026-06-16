"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guard";
import { recordAudit } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications";
import { resolveMyService, myServiceRole } from "@/lib/services";

type Session = Awaited<ReturnType<typeof requirePermission>>;

// Only a service MANAGER (or platform admin) may manage the team.
async function requireManager(session: Session) {
  const service = await resolveMyService(session.user.id);
  if (!service) throw new Error("لست عضواً في أي خدمة");
  const role = await myServiceRole(service.id, session.user.id);
  const isAdmin = session.user.permissions.includes("users:VIEW");
  if (role !== "MANAGER" && !isAdmin) throw new Error("إدارة الفريق من اختصاص مدير الخدمة");
  return service;
}

// Add an existing user to the service team by email.
export async function addServiceMember(formData: FormData): Promise<void> {
  const session = await requirePermission("services", "VIEW");
  const service = await requireManager(session);
  const email = String(formData.get("email") ?? "").toLowerCase().trim();
  const role = String(formData.get("role") ?? "MEMBER") === "MANAGER" ? "MANAGER" : "MEMBER";
  if (!email) throw new Error("أدخل بريد العضو");

  const user = await prisma.user.findUnique({ where: { email }, select: { id: true, fullName: true } });
  if (!user) throw new Error("لا يوجد مستخدم بهذا البريد — أنشئ الحساب أولاً");

  const existing = await prisma.serviceMember.findUnique({
    where: { serviceId_userId: { serviceId: service.id, userId: user.id } },
    select: { id: true },
  });
  if (existing) throw new Error("هذا المستخدم عضو بالفعل");

  await prisma.serviceMember.create({
    data: { serviceId: service.id, userId: user.id, role: role as never },
  });
  await recordAudit({ actorId: session.user.id, action: "service.memberAdded", entityType: "Service", entityId: service.id, metadata: { email, role } });
  await dispatchNotification({ event: "service.assigned", userId: user.id, data: { service: service.name } });
  revalidatePath("/console/team");
}

export async function removeServiceMember(memberId: string): Promise<void> {
  const session = await requirePermission("services", "VIEW");
  const service = await requireManager(session);
  const member = await prisma.serviceMember.findUnique({ where: { id: memberId }, select: { serviceId: true, userId: true, role: true } });
  if (!member || member.serviceId !== service.id) throw new Error("العضو غير موجود");
  if (member.userId === session.user.id) throw new Error("لا يمكنك إزالة نفسك");

  // Keep at least one manager.
  if (member.role === "MANAGER") {
    const managers = await prisma.serviceMember.count({ where: { serviceId: service.id, role: "MANAGER" } });
    if (managers <= 1) throw new Error("يجب بقاء مدير واحد على الأقل");
  }

  await prisma.serviceMember.delete({ where: { id: memberId } });
  await recordAudit({ actorId: session.user.id, action: "service.memberRemoved", entityType: "Service", entityId: service.id });
  revalidatePath("/console/team");
}

export async function setMemberRole(memberId: string, role: string): Promise<void> {
  const session = await requirePermission("services", "VIEW");
  const service = await requireManager(session);
  const member = await prisma.serviceMember.findUnique({ where: { id: memberId }, select: { serviceId: true, role: true } });
  if (!member || member.serviceId !== service.id) throw new Error("العضو غير موجود");
  const next = role === "MANAGER" ? "MANAGER" : "MEMBER";
  if (member.role === "MANAGER" && next === "MEMBER") {
    const managers = await prisma.serviceMember.count({ where: { serviceId: service.id, role: "MANAGER" } });
    if (managers <= 1) throw new Error("يجب بقاء مدير واحد على الأقل");
  }
  await prisma.serviceMember.update({ where: { id: memberId }, data: { role: next as never } });
  revalidatePath("/console/team");
}
