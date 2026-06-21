import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES } from "@/lib/rbac";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ApprovalActions } from "@/components/admin/approval-actions";

export const metadata = { title: "مراجعة الحسابات" };

export default async function ApprovalsPage() {
  await requirePermission("approvals", "VIEW");

  const pending = await prisma.user.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    include: { governorate: { select: { nameAr: true } } },
  });
  const typeLabel = (v: string) => ACCOUNT_TYPES.find((t) => t.value === v)?.label ?? v;

  return (
    <>
      <PageHeader title="مراجعة الحسابات الجديدة" description="الموافقة على الحسابات أو رفضها قبل منحها الوصول إلى المنصة.">
        <Badge tone="warning">{pending.length} بانتظار المراجعة</Badge>
      </PageHeader>

      {pending.length === 0 ? (
        <EmptyState title="لا توجد طلبات بانتظار المراجعة" description="ستظهر هنا الحسابات الجديدة عند تسجيلها." />
      ) : (
        <div className="stagger-children space-y-3">
          {pending.map((u) => (
            <Card key={u.id} className="group flex flex-wrap items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_20px_-8px_var(--primary)]">
              <div className="flex items-center gap-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface-3 text-base font-bold text-primary">{u.fullName.charAt(0)}</span>
                <div>
                  <p className="font-semibold text-fg">{u.fullName}</p>
                  <p className="text-sm text-fg-muted" dir="ltr">{u.email}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-fg-faint">
                    <Badge tone="primary">{typeLabel(u.accountType)}</Badge>
                    {u.governorate && <span>{u.governorate.nameAr}</span>}
                    <span>· {formatDateTime(u.createdAt)}</span>
                  </div>
                </div>
              </div>
              <ApprovalActions userId={u.id} />
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
