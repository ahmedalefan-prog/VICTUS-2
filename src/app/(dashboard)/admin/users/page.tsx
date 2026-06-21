import { requirePermission } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES, ACCOUNT_STATUSES } from "@/lib/rbac";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { StatusBadge } from "@/components/ui/badge";
import { AnimatedStat } from "@/components/ui/animated-stat";
import { DataTable } from "@/components/ui/data-table";
import { Pagination } from "@/components/ui/pagination";
import { UserLink } from "@/components/ui/user-link";
import { UserControls } from "@/components/admin/user-controls";
import { ShieldCheck, Users, UserCheck, UserX, Clock } from "lucide-react";
import Link from "next/link";

export const metadata = { title: "المستخدمون" };

const PAGE_SIZE = 20;

export default async function UsersPage({ searchParams }: { searchParams: Promise<{ status?: string; type?: string; page?: string }> }) {
  const session = await requirePermission("users", "VIEW");
  const sp = await searchParams;
  const currentPage = Math.max(1, Number(sp.page) || 1);

  const where = {
    ...(sp.status ? { status: sp.status as never } : {}),
    ...(sp.type ? { accountType: sp.type as never } : {}),
  };
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { governorate: { select: { nameAr: true } } },
      skip: (currentPage - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.user.count({ where }),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const canManage = can(session.user.permissions, "users", "MANAGE");
  const typeLabel = (v: string) => ACCOUNT_TYPES.find((t) => t.value === v)?.label ?? v;

  const stats = {
    total: await prisma.user.count({ where }),
    pending: await prisma.user.count({ where: { ...where, status: "PENDING" } }),
    approved: await prisma.user.count({ where: { ...where, status: "APPROVED" } }),
    suspended: await prisma.user.count({ where: { ...where, status: "SUSPENDED" } }),
  };

  return (
    <>
      <PageHeader title="إدارة المستخدمين" description="جميع حسابات المنصة والتحكم في حالتها وأنواعها." />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <AnimatedStat icon={Users} label="إجمالي المستخدمين" value={stats.total} format={false} />
        <AnimatedStat icon={Clock} label="بانتظار المراجعة" value={stats.pending} trend={stats.pending > 0 ? "up" : "neutral"} trendLabel="بحاجة مراجعة" />
        <AnimatedStat icon={UserCheck} label="مقبول" value={stats.approved} trend="up" trendLabel="نشط" />
        <AnimatedStat icon={UserX} label="معلّق" value={stats.suspended} trend={stats.suspended > 0 ? "down" : "neutral"} trendLabel={stats.suspended > 0 ? "بحاجة مراجعة" : "لا يوجد"} />
      </div>

      <div className="mb-5 flex flex-wrap gap-2 text-sm">
        <FilterLink value="" current={sp.status} label="الكل" type={sp.type} />
        {ACCOUNT_STATUSES.map((s) => <FilterLink key={s.value} value={s.value} current={sp.status} label={s.label} type={sp.type} />)}
      </div>

      <DataTable
        data={users}
        keyExtractor={(u) => u.id}
        searchable
        searchPlaceholder="ابحث بالاسم أو البريد..."
        columns={[
          {
            key: "user",
            label: "المستخدم",
            sortable: true,
            render: (u) => (
              <div>
                <UserLink userId={u.id} name={u.fullName} className="font-medium text-fg" />
                <p className="text-xs text-fg-faint" dir="ltr">{u.email}</p>
                <p className="text-xs text-fg-faint">{u.governorate?.nameAr ?? ""}</p>
              </div>
            ),
          },
          {
            key: "type",
            label: "نوع الحساب",
            sortable: true,
            render: (u) => <span className="text-fg-muted">{typeLabel(u.accountType)}</span>,
          },
          {
            key: "status",
            label: "الحالة",
            sortable: true,
            render: (u) => <StatusBadge status={u.status} />,
          },
          {
            key: "date",
            label: "التسجيل",
            sortable: true,
            render: (u) => <span className="text-fg-muted">{formatDate(u.createdAt)}</span>,
          },
          ...(canManage
            ? [
                {
                  key: "actions" as const,
                  label: "إجراءات",
                  render: (u: typeof users[0]) => (
                    <div className="flex items-center gap-2">
                      <UserControls userId={u.id} status={u.status} accountType={u.accountType} isSelf={u.id === session.user.id} />
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="flex items-center gap-1 rounded-lg border border-border-soft px-2 py-1 text-xs font-medium text-fg-muted hover:bg-surface-2 transition-colors"
                        title="إدارة الصلاحيات"
                      >
                        <ShieldCheck className="h-3.5 w-3.5" /> الصلاحيات
                      </Link>
                    </div>
                  ),
                },
              ]
            : []),
        ]}
        emptyMessage="لا يوجد مستخدمون مطابقون."
      />
      <Pagination currentPage={currentPage} totalPages={totalPages} baseHref="/admin/users" />
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
    <Link
      href={href}
      className={`rounded-lg border px-3 py-1.5 transition-colors ${active ? "border-primary/40 bg-primary-soft text-primary" : "border-border-soft bg-surface-2/40 text-fg-muted hover:text-fg"}`}
    >
      {label}
    </Link>
  );
}
