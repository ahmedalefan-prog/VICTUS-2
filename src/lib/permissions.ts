import { prisma } from "@/lib/prisma";
import { permKey, ACCOUNT_TYPES, type PermissionAction } from "@/lib/rbac";

// شبكة أمان: يضمن أن المستخدم المعتمَد يملك دوره الافتراضي إن لم يكن لديه أي دور.
// يُستدعى عند الدخول فيُصلّح ذاتياً أي حساب عالق بلا صلاحيات (يُحوَّل لـ denied=1).
// لا يتدخّل إن كان للمستخدم أدوار (يحترم تخصيص الإدارة).
export async function ensureDefaultRole(userId: string, accountType: string): Promise<void> {
  const existing = await prisma.userRole.count({ where: { userId } });
  if (existing > 0) return;
  const roleKey = ACCOUNT_TYPES.find((t) => t.value === accountType)?.roleKey;
  if (!roleKey) return;
  const role = await prisma.role.findUnique({ where: { key: roleKey }, select: { id: true } });
  if (!role) return;
  await prisma.userRole.create({ data: { userId, roleId: role.id } }).catch(() => {});
}

// Compute a user's effective permission keys (roles ∪ direct-allow) − direct-revoke.
export async function getEffectivePermissions(userId: string): Promise<string[]> {
  const [roleRows, userPermRows] = await Promise.all([
    prisma.userRole.findMany({
      where: { userId },
      select: {
        role: {
          select: {
            permissions: {
              select: { permission: { select: { resource: true, action: true } } },
            },
          },
        },
      },
    }),
    prisma.userPermission.findMany({
      where: { userId },
      select: {
        allow: true,
        permission: { select: { resource: true, action: true } },
      },
    }),
  ]);

  const effective = new Set<string>();
  for (const ur of roleRows) {
    for (const rp of ur.role.permissions) {
      effective.add(permKey(rp.permission.resource, rp.permission.action as PermissionAction));
    }
  }
  for (const up of userPermRows) {
    const key = permKey(up.permission.resource, up.permission.action as PermissionAction);
    if (up.allow) effective.add(key);
    else effective.delete(key);
  }
  return [...effective];
}
