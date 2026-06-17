import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { can, ACCOUNT_TYPES } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { UserRoleToggles } from "@/components/admin/user-role-toggles";
import { UserOverrides } from "@/components/admin/user-overrides";

export const metadata = { title: "صلاحيات المستخدم" };

export default async function UserAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("users", "VIEW");
  const canEdit = can(session.user.permissions, "roles", "MANAGE");

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      roles: { select: { roleId: true } },
      permissions: { include: { permission: { select: { resource: true, action: true } } } },
      governorate: { select: { nameAr: true } },
    },
  });
  if (!user) notFound();

  const assignedRoleIds = user.roles.map((r) => r.roleId);
  const [allRoles, rolePermRows] = await Promise.all([
    prisma.role.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, name: true, key: true } }),
    assignedRoleIds.length
      ? prisma.rolePermission.findMany({ where: { roleId: { in: assignedRoleIds } }, include: { permission: { select: { resource: true, action: true } } } })
      : Promise.resolve([]),
  ]);

  const rolePerms = [...new Set(rolePermRows.map((p) => `${p.permission.resource}:${p.permission.action}`))];
  const overrides = Object.fromEntries(user.permissions.map((up) => [`${up.permission.resource}:${up.permission.action}`, up.allow]));
  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === user.accountType)?.label ?? user.accountType;

  return (
    <>
      <Link href="/admin/users" className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronRight className="h-4 w-4" /> العودة للمستخدمين
      </Link>

      <PageHeader title={user.fullName} description={user.email}>
        <StatusBadge status={user.status} />
      </PageHeader>

      <div className="mb-5 grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card>
          <h3 className="mb-2 font-semibold text-fg">الحساب</h3>
          <dl className="space-y-1 text-sm">
            <Row label="النوع" value={typeLabel} />
            <Row label="المحافظة" value={user.governorate?.nameAr ?? "—"} />
            <Row label="التسجيل" value={formatDate(user.createdAt)} />
            {user.reviewedAt && <Row label="روجِع" value={formatDate(user.reviewedAt)} />}
          </dl>
        </Card>

        <Card className="lg:col-span-2">
          <h3 className="mb-3 font-semibold text-fg">الأدوار</h3>
          <UserRoleToggles userId={user.id} roles={allRoles} assigned={assignedRoleIds} canEdit={canEdit} />
        </Card>
      </div>

      <UserOverrides userId={user.id} rolePerms={rolePerms} overrides={overrides} canEdit={canEdit} />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-medium text-fg">{value}</dd>
    </div>
  );
}
