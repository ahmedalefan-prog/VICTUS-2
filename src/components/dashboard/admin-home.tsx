import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { SERVICE_TYPE_META, TX_STATUS_META } from "@/lib/services-meta";
import { formatIQD, formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollText, UserCheck, Megaphone, BarChart3, ChevronLeft } from "lucide-react";

export async function AdminHome() {
  const [grand, recentTx, pendingUsers, pendingCampaigns, adRevenue] = await Promise.all([
    prisma.partnerTransaction.aggregate({ _sum: { agreedAmount: true }, _count: true }),
    prisma.partnerTransaction.findMany({ orderBy: { createdAt: "desc" }, take: 6 }),
    prisma.user.count({ where: { status: "PENDING" } }),
    prisma.adCampaign.count({ where: { status: "PENDING_REVIEW" } }),
    prisma.adCampaign.aggregate({ where: { paymentStatus: "PAID" }, _sum: { amountDue: true } }),
  ]);

  return (
    <div className="space-y-6">
      <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi label="إجمالي المعاملات الموثّقة" value={formatIQD(Number(grand._sum.agreedAmount ?? 0))} sub={`${grand._count} عملية`} href="/admin/transactions" primary />
        <Kpi label="حسابات بانتظار المراجعة" value={String(pendingUsers)} sub="موافقة/رفض" href="/admin/approvals" icon={<UserCheck className="h-4 w-4" />} />
        <Kpi label="حملات بانتظار المراجعة" value={String(pendingCampaigns)} sub="اعتماد/دفع" href="/admin/ads" icon={<Megaphone className="h-4 w-4" />} />
        <Kpi label="إيراد الإعلانات المُحصّل" value={formatIQD(Number(adRevenue._sum.amountDue ?? 0))} sub="مدفوعة" href="/admin/revenue" icon={<BarChart3 className="h-4 w-4" />} />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-fg"><ScrollText className="h-5 w-5 text-primary" /> أحدث المعاملات</h2>
          <Link href="/admin/transactions" className="flex items-center gap-0.5 text-sm font-medium text-primary transition-colors hover:text-primary-strong hover:underline">الكل <ChevronLeft className="h-3.5 w-3.5" /></Link>
        </div>
        {recentTx.length === 0 ? (
          <EmptyState title="لا توجد معاملات موثّقة بعد." />
        ) : (
          <ul className="space-y-2">
            {recentTx.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_20px_-8px_var(--primary)]">
                <div className="flex items-center gap-2">
                  <Badge tone="info">{SERVICE_TYPE_META[t.type]?.label ?? t.type}</Badge>
                  <span className="text-sm font-medium text-fg">{t.referenceId}</span>
                  <span className="text-xs text-fg-muted">{t.requesterName} · {formatDate(t.createdAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-fg">{formatIQD(Number(t.agreedAmount))}</span>
                  <Badge tone={TX_STATUS_META[t.status]?.tone ?? "muted"}>{TX_STATUS_META[t.status]?.label}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <h2 className="mb-3 font-semibold text-fg">لوحات الإدارة</h2>
        <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <AdminLink href="/admin/users" label="المستخدمون" />
          <AdminLink href="/admin/roles" label="الأدوار والصلاحيات" />
          <AdminLink href="/admin/transactions" label="معاملات الخدمات" />
          <AdminLink href="/admin/revenue" label="إيرادات الإعلانات" />
          <AdminLink href="/admin/audit" label="سجل العمليات" />
          <AdminLink href="/admin/settings" label="إعدادات النظام" />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, href, primary, icon }: { label: string; value: string; sub: string; href: string; primary?: boolean; icon?: React.ReactNode }) {
  return (
    <Link href={href}>
      <Card className={`group h-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_-12px_var(--primary)] ${primary ? "border-primary/30" : ""}`}>
        <p className="flex items-center gap-1.5 text-xs text-fg-muted">{icon}{label}</p>
        <p className={`mt-1 text-xl font-bold transition-colors group-hover:text-primary ${primary ? "text-primary" : "text-fg"}`}>{value}</p>
        <p className="mt-0.5 text-xs text-fg-faint">{sub}</p>
      </Card>
    </Link>
  );
}

function AdminLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href}>
      <Card className="group flex items-center justify-between transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30">
        <span className="font-medium text-fg transition-colors group-hover:text-primary">{label}</span>
        <ChevronLeft className="h-4 w-4 text-fg-faint transition-transform group-hover:-translate-x-0.5" />
      </Card>
    </Link>
  );
}
