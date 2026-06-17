import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "سجل العمليات" };

const ACTION_LABELS: Record<string, string> = {
  "account.approve": "الموافقة على حساب",
  "account.reject": "رفض حساب",
  "account.type.change": "تغيير نوع الحساب",
  "account.status.approved": "تفعيل حساب",
  "account.status.suspended": "تعليق حساب",
  "role.assign": "إسناد دور",
  "role.revoke": "سحب دور",
  "order.created": "إنشاء طلب",
  "order.fulfillment": "تحديث حالة طلب",
  "order.cancelled": "إلغاء طلب",
  "maintenance.created": "طلب صيانة",
  "maintenance.completed": "إنهاء صيانة",
  "transactions.export": "تصدير المعاملات",
  "settings.update": "تحديث الإعدادات",
  "brand.create": "إضافة علامة",
  "brand.delete": "حذف علامة",
};

export default async function AuditPage() {
  await requirePermission("audit", "VIEW");

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { fullName: true } } },
  });

  return (
    <>
      <PageHeader title="سجل العمليات" description="سجل غير قابل للتعديل لكل العمليات الحساسة على المنصة (Audit Log).">
        <Badge tone="muted">{logs.length} عملية</Badge>
      </PageHeader>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-right text-xs text-fg-faint">
                <th className="px-4 py-3 font-medium">العملية</th>
                <th className="px-4 py-3 font-medium">المنفّذ</th>
                <th className="px-4 py-3 font-medium">الكيان</th>
                <th className="px-4 py-3 font-medium">الوقت</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-b border-border-soft/60 last:border-0">
                  <td className="px-4 py-3"><Badge tone="primary">{ACTION_LABELS[l.action] ?? l.action}</Badge></td>
                  <td className="px-4 py-3 text-fg-muted">{l.actor?.fullName ?? "—"}</td>
                  <td className="px-4 py-3 text-fg-faint" dir="ltr">{l.entityType ? `${l.entityType}#${l.entityId?.slice(0, 6)}` : "—"}</td>
                  <td className="px-4 py-3 text-fg-muted">{formatDateTime(l.createdAt)}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-fg-muted">لا توجد عمليات مسجّلة بعد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
