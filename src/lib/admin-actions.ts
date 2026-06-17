"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guard";
import { ACCOUNT_TYPES } from "@/lib/rbac";
import { recordAudit } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications";

// Default system roles, one per account type.
const DEFAULT_ROLE_KEYS = ACCOUNT_TYPES.map((t) => t.roleKey);

// Reset a user's default role to match their account type. Removes the default
// roles of OTHER account types so changing type doesn't accumulate roles (which
// would leak old-role permissions via the effective-permissions union). Custom
// roles and explicit user overrides are preserved.
async function syncDefaultRole(userId: string, accountType: string) {
  const roleKey = ACCOUNT_TYPES.find((t) => t.value === accountType)?.roleKey;
  if (!roleKey) return;
  await prisma.userRole.deleteMany({ where: { userId, role: { key: { in: DEFAULT_ROLE_KEYS, not: roleKey } } } });
  const role = await prisma.role.findUnique({ where: { key: roleKey }, select: { id: true } });
  if (!role) return;
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId, roleId: role.id } },
    update: {},
    create: { userId, roleId: role.id },
  });
}

export async function approveUser(userId: string): Promise<void> {
  const session = await requirePermission("approvals", "MANAGE");
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("المستخدم غير موجود");

  await prisma.user.update({ where: { id: userId }, data: { status: "APPROVED", reviewedById: session.user.id, reviewedAt: new Date() } });
  await syncDefaultRole(userId, user.accountType);
  await recordAudit({ actorId: session.user.id, action: "account.approve", entityType: "User", entityId: userId });
  await dispatchNotification({ event: "account.approved", userId });
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/users");
}

export async function rejectUser(userId: string, note?: string): Promise<void> {
  const session = await requirePermission("approvals", "MANAGE");
  await prisma.user.update({
    where: { id: userId },
    data: { status: "REJECTED", reviewedById: session.user.id, reviewedAt: new Date(), reviewNote: note || null },
  });
  await recordAudit({ actorId: session.user.id, action: "account.reject", entityType: "User", entityId: userId, metadata: { note } });
  await dispatchNotification({ event: "account.rejected", userId, data: { note: note ?? "" } });
  revalidatePath("/admin/approvals");
  revalidatePath("/admin/users");
}

export async function setUserStatus(userId: string, status: "APPROVED" | "SUSPENDED" | "PENDING"): Promise<void> {
  const session = await requirePermission("users", "MANAGE");
  await prisma.user.update({ where: { id: userId }, data: { status } });
  await recordAudit({ actorId: session.user.id, action: `account.status.${status.toLowerCase()}`, entityType: "User", entityId: userId });
  await dispatchNotification({ event: "account.statusChanged", userId, data: { status } });
  revalidatePath("/admin/users");
}

export async function changeAccountType(userId: string, accountType: string): Promise<void> {
  const session = await requirePermission("users", "MANAGE");
  if (!ACCOUNT_TYPES.some((t) => t.value === accountType)) throw new Error("نوع حساب غير صالح");
  await prisma.user.update({ where: { id: userId }, data: { accountType: accountType as never } });
  await syncDefaultRole(userId, accountType);
  await recordAudit({ actorId: session.user.id, action: "account.type.change", entityType: "User", entityId: userId, metadata: { accountType } });
  revalidatePath("/admin/users");
}

// Toggle a single role on/off for a user.
export async function toggleUserRole(userId: string, roleId: string, enabled: boolean): Promise<void> {
  const session = await requirePermission("roles", "MANAGE");
  if (enabled) {
    await prisma.userRole.upsert({ where: { userId_roleId: { userId, roleId } }, update: {}, create: { userId, roleId } });
  } else {
    await prisma.userRole.delete({ where: { userId_roleId: { userId, roleId } } }).catch(() => undefined);
  }
  await recordAudit({ actorId: session.user.id, action: enabled ? "role.assign" : "role.revoke", entityType: "User", entityId: userId, metadata: { roleId } });
  revalidatePath(`/admin/users/${userId}`);
}
