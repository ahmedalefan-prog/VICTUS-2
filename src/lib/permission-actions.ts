"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guard";
import { recordAudit } from "@/lib/audit";
import { RESOURCES, PERMISSION_ACTIONS } from "@/lib/rbac";

const RESOURCE_KEYS = new Set(RESOURCES.map((r) => r.key));
const ACTION_KEYS = new Set<string>(PERMISSION_ACTIONS);

function validate(resource: string, action: string) {
  if (!RESOURCE_KEYS.has(resource as never)) throw new Error("مورد غير صالح");
  if (!ACTION_KEYS.has(action)) throw new Error("إجراء غير صالح");
}

async function ensurePermission(resource: string, action: string): Promise<string> {
  const perm = await prisma.permission.upsert({
    where: { resource_action: { resource, action: action as never } },
    update: {},
    create: { resource, action: action as never },
  });
  return perm.id;
}

// ─────────────────────── role permissions ───────────────────────
export async function setRolePermission(roleId: string, resource: string, action: string, enabled: boolean): Promise<void> {
  const session = await requirePermission("roles", "MANAGE");
  validate(resource, action);
  const role = await prisma.role.findUnique({ where: { id: roleId }, select: { key: true } });
  if (!role) throw new Error("الدور غير موجود");
  if (role.key === "super_admin") throw new Error("دور المدير العام محمي (صلاحيات كاملة دائماً)");

  const permissionId = await ensurePermission(resource, action);
  if (enabled) {
    await prisma.rolePermission.upsert({ where: { roleId_permissionId: { roleId, permissionId } }, update: {}, create: { roleId, permissionId } });
  } else {
    await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
  }
  await recordAudit({
    actorId: session.user.id,
    action: `permission.role.${enabled ? "grant" : "revoke"}`,
    entityType: "Role",
    entityId: roleId,
    metadata: { role: role.key, permission: `${resource}:${action}`, enabled },
  });
  revalidatePath("/admin/roles");
}

// ─────────────────────── user overrides ───────────────────────
// state: "grant" (extra grant) · "revoke" (remove even if in role) · "inherit" (drop override)
export async function setUserOverride(userId: string, resource: string, action: string, state: "grant" | "revoke" | "inherit"): Promise<void> {
  const session = await requirePermission("roles", "MANAGE");
  validate(resource, action);
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!user) throw new Error("المستخدم غير موجود");

  const permissionId = await ensurePermission(resource, action);
  if (state === "inherit") {
    await prisma.userPermission.deleteMany({ where: { userId, permissionId } });
  } else {
    await prisma.userPermission.upsert({
      where: { userId_permissionId: { userId, permissionId } },
      update: { allow: state === "grant" },
      create: { userId, permissionId, allow: state === "grant" },
    });
  }
  await recordAudit({
    actorId: session.user.id,
    action: `permission.user.${state}`,
    entityType: "User",
    entityId: userId,
    metadata: { permission: `${resource}:${action}`, state },
  });
  revalidatePath(`/admin/users/${userId}`);
}
