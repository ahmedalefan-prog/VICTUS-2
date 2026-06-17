import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { RoleMatrix } from "@/components/admin/role-matrix";
import { Users } from "lucide-react";

export const metadata = { title: "الأدوار والصلاحيات" };

export default async function RolesPage() {
  const session = await requirePermission("roles", "VIEW");
  const canEdit = can(session.user.permissions, "roles", "MANAGE");

  const roles = await prisma.role.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      permissions: { include: { permission: { select: { resource: true, action: true } } } },
      _count: { select: { users: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="الأدوار والصلاحيات"
        description={canEdit ? "فعّل/عطّل صلاحيات كل دور مباشرة — تُحفظ فوراً وتسري على المستخدمين بدون إعادة نشر." : "نظام RBAC تفصيلي: لكل دور صلاحيات (عرض/إنشاء/تعديل/حذف/إدارة/تصدير) لكل قسم."}
      >
        <Link href="/admin/users" className="flex items-center gap-1 rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-fg-muted hover:bg-surface-2">
          <Users className="h-4 w-4" /> تجاوزات المستخدمين
        </Link>
      </PageHeader>

      <div className="space-y-5">
        {roles.map((role) => (
          <RoleMatrix
            key={role.id}
            roleId={role.id}
            roleKey={role.key}
            roleName={role.name}
            isSystem={role.isSystem}
            userCount={role._count.users}
            perms={role.permissions.map((p) => `${p.permission.resource}:${p.permission.action}`)}
            canEdit={canEdit}
          />
        ))}
      </div>
    </>
  );
}
