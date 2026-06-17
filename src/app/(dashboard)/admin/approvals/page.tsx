import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES } from "@/lib/rbac";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ApprovalActions } from "@/components/admin/approval-actions";
import { Inbox } from "lucide-react";

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
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Inbox className="mb-3 h-10 w-10 text-fg-faint" />
          <p className="font-medium text-fg">لا توجد طلبات بانتظار المراجعة</p>
          <p className="mt-1 text-sm text-fg-muted">ستظهر هنا الحسابات الجديدة عند تسجيلها.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {pending.map((u) => (
            <Card key={u.id} className="flex flex-wrap items-center justify-between gap-4">
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
