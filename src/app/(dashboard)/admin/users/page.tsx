import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, ACCOUNT_STATUSES } from "@/lib/rbac";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";
import { UserLink } from "@/components/ui/user-link";
import { UserControls } from "@/components/admin/user-controls";
import { ShieldCheck } from "lucide-react";

export const metadata = { title: "المستخدمون" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string }> }) {
  const session = await requirePermission("users", "VIEW");
  const sp = await searchParams;

  const where = {
    ...(sp.status ? { status: sp.status as never } : {}),
    ...(sp.type ? { accountType: sp.type as never } : {}),
  };
  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: { governorate: { select: { nameAr: true } } },
    take: 200,
  });

  const canManage = can(session.user.permissions, "users", "MANAGE");
  const typeLabel = (v: string) => ACCOUNT_TYPES.find((t) => t.value === v)?.label ?? v;

  return (
    <>
      <PageHeader title="إدارة المستخدمين" description="عرض جميع حسابات المنصة والتحكم في حالتها وأنواعها." />

      <div className="mb-5 flex flex-wrap gap-2 text-sm">
        <FilterLink value="" current={sp.status} label="الكل" type={sp.type} />
        {ACCOUNT_STATUSES.map((s) => <FilterLink key={s.value} value={s.value} current={sp.status} label={s.label} type={sp.type} />)}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-right text-xs text-fg-faint">
                <th className="px-4 py-3 font-medium">المستخدم</th>
                <th className="px-4 py-3 font-medium">نوع الحساب</th>
                <th className="px-4 py-3 font-medium">المحافظة</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
                <th className="px-4 py-3 font-medium">التسجيل</th>
                {canManage && <th className="px-4 py-3 font-medium">إجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-border-soft/60 last:border-0 hover:bg-surface-2/30">
                  <td className="px-4 py-3">
                    <UserLink userId={u.id} name={u.fullName} className="font-medium text-fg" />
                    <p className="text-xs text-fg-faint" dir="ltr">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{typeLabel(u.accountType)}</td>
                  <td className="px-4 py-3 text-fg-muted">{u.governorate?.nameAr ?? "—"}</td>
                  <td className="px-4 py-3"><StatusBadge status={u.status} /></td>
                  <td className="px-4 py-3 text-fg-muted">{formatDate(u.createdAt)}</td>
                  {canManage && (
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <UserControls userId={u.id} status={u.status} accountType={u.accountType} isSelf={u.id === session.user.id} />
                        <Link href={`/admin/users/${u.id}`} className="flex items-center gap-1 rounded-lg border border-border-soft px-2 py-1 text-xs font-medium text-fg-muted hover:bg-surface-2" title="إدارة الصلاحيات">
                          <ShieldCheck className="h-3.5 w-3.5" /> الصلاحيات
                        </Link>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {users.length === 0 && (
                <tr><td colSpan={canManage ? 6 : 5} className="px-4 py-10 text-center text-fg-muted">لا يوجد مستخدمون مطابقون.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function FilterLink({ value, current, label, type }: { value: string; current?: string; label: string; type?: string }) {
  const active = (current ?? "") === value;
  const params = new URLSearchParams();
  if (value) params.set("status", value);
  if (type) params.set("type", type);
  const href = params.toString() ? `/admin/users?${params}` : "/admin/users";
  return (
    <Link href={href}
      className={`rounded-lg border px-3 py-1.5 transition-colors ${active ? "border-primary/40 bg-primary-soft text-primary" : "border-border-soft bg-surface-2/40 text-fg-muted hover:text-fg"}`}>
      {label}
    </Link>
  );
}
