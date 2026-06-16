// VICTUS — Service layer (lab / market / maintenance) — server helpers.
// The three admin-owned services. Metadata lives in services-meta.ts (client-safe)
// and is re-exported here. The platform documents deals only — no commissions.

import { prisma } from "@/lib/prisma";
import { can } from "@/lib/rbac";
import { isPlatformAdmin } from "@/lib/guard";
import { SERVICE_TYPE_META } from "@/lib/services-meta";

export * from "@/lib/services-meta";

// ─────────────────────── service resolution ───────────────────────

export async function getService(type: "LAB" | "MARKET" | "MAINTENANCE") {
  return prisma.service.findUnique({ where: { type } });
}

// ─────────────────────── order numbers ───────────────────────

export async function nextOrderNumber(): Promise<string> {
  const count = await prisma.serviceOrder.count();
  return `ORD-${String(count + 1).padStart(5, "0")}`;
}

export async function nextRequestNumber(): Promise<string> {
  const count = await prisma.maintenanceRequest.count();
  return `REQ-${String(count + 1).padStart(5, "0")}`;
}

// The maintenance team: members of the MAINTENANCE service (engineers to assign).
export async function getMaintenanceTeam() {
  const service = await getService("MAINTENANCE");
  if (!service) return { service: null, members: [] as { id: string; name: string; role: string }[] };
  const members = await prisma.serviceMember.findMany({
    where: { serviceId: service.id },
    include: { user: { select: { id: true, fullName: true } } },
    orderBy: { createdAt: "asc" },
  });
  return {
    service,
    members: members.map((m) => ({ id: m.user.id, name: m.user.fullName, role: m.role })),
  };
}

// ─────────────────────── guards ───────────────────────

type SessionLike = { user: { id: string; permissions: string[] } };

export async function myServiceRole(serviceId: string, userId: string): Promise<string | null> {
  const m = await prisma.serviceMember.findUnique({
    where: { serviceId_userId: { serviceId, userId } },
    select: { role: true },
  });
  return m?.role ?? null;
}

// Every member of the service may manage it. Platform admins pass through.
export async function assertServiceMember(serviceId: string, session: SessionLike): Promise<void> {
  if (isPlatformAdmin(session)) return;
  const role = await myServiceRole(serviceId, session.user.id);
  if (!role) throw new Error("ليست لديك صلاحية على هذه الخدمة");
}

// The service the caller belongs to (for the self-service console).
export async function resolveMyService(userId: string) {
  const membership = await prisma.serviceMember.findFirst({
    where: { userId },
    include: { service: true },
    orderBy: { createdAt: "asc" },
  });
  return membership?.service ?? null;
}

// Requesters (clinics / doctors) may place orders — has CREATE on the service.
export function canRequest(session: SessionLike, type: "LAB" | "MARKET" | "MAINTENANCE"): boolean {
  return can(session.user.permissions, SERVICE_TYPE_META[type].resource, "CREATE");
}
