import { prisma } from "@/lib/prisma";

// Record an immutable audit-log entry (admin/security trail).
// Never throws into the caller's flow.
export async function recordAudit(input: {
  actorId?: string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}) {
  try {
    await prisma.auditLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata as object | undefined,
        ipAddress: input.ipAddress ?? null,
      },
    });
  } catch (e) {
    console.error("audit log failed:", e);
  }
}

// Record a user-facing activity event (Activity Feed — distinct from AuditLog).
export async function logActivity(input: {
  actorId: string;
  verb: string;
  summary: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await prisma.activityEvent.create({
      data: {
        actorId: input.actorId,
        verb: input.verb,
        summary: input.summary,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata as object | undefined,
      },
    });
  } catch (e) {
    console.error("activity log failed:", e);
  }
}
