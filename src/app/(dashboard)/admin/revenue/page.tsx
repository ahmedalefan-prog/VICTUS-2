import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { formatIQD, formatDate } from "@/lib/format";
import { AD_TYPE_META, CAMPAIGN_STATUS_META, AD_PAYMENT_STATUS_META, ctr } from "@/lib/ads";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "إيرادات الإعلانات" };

export default async function RevenuePage() {
  await requirePermission("reports", "VIEW");

  const [paidAgg, pendingAgg, activeCount, imp, clk, recent] = await Promise.all([
    prisma.adCampaign.aggregate({ where: { paymentStatus: "PAID" }, _sum: { amountDue: true }, _count: true }),
    prisma.adCampaign.aggregate({ where: { paymentStatus: "PENDING_REVIEW" }, _sum: { amountDue: true } }),
    prisma.adCampaign.count({ where: { status: "ACTIVE" } }),
    prisma.adImpression.count(),
    prisma.adClick.count(),
    prisma.adCampaign.findMany({
      orderBy: { createdAt: "desc" },
      take: 25,
      include: { advertiser: { select: { name: true } }, _count: { select: { impressions: true, clicks: true } } },
    }),
  ]);

  const collected = Number(paidAgg._sum.amountDue ?? 0);
  const pendingDue = Number(pendingAgg._sum.amountDue ?? 0);

  return (
    <>
      <PageHeader title="إيرادات الإعلانات" description="إجمالي إيرادات الحملات وأدائها.">
        <Link href="/admin/ads" className="text-sm font-medium text-primary hover:underline">مراجعة الحملات ←</Link>
      </PageHeader>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <Card className="border-primary/30">
          <p className="text-xs text-fg-muted">الإيراد المُحصّل</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatIQD(collected)}</p>
          <p className="mt-0.5 text-xs text-fg-faint">{paidAgg._count} حملة مدفوعة</p>
        </Card>
        <Card>
          <p className="text-xs text-fg-muted">مستحقّ قيد التحصيل</p>
          <p className="mt-1 text-xl font-bold text-fg">{formatIQD(pendingDue)}</p>
        </Card>
        <Card>
          <p className="text-xs text-fg-muted">حملات نشطة</p>
          <p className="mt-1 text-xl font-bold text-fg">{activeCount}</p>
        </Card>
        <Card>
          <p className="text-xs text-fg-muted">الأداء الكلي</p>
          <p className="mt-1 text-sm font-bold text-fg">{imp} مشاهدة · {clk} نقرة</p>
          <p className="mt-0.5 text-xs text-fg-faint">CTR {ctr(imp, clk)}</p>
        </Card>
      </div>

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-right text-xs text-fg-faint">
                <th className="px-4 py-3 font-medium">الحملة</th>
                <th className="px-4 py-3 font-medium">المعلن</th>
                <th className="px-4 py-3 font-medium">النوع</th>
                <th className="px-4 py-3 font-medium">المستحق</th>
                <th className="px-4 py-3 font-medium">الأداء</th>
                <th className="px-4 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((c) => (
                <tr key={c.id} className="border-b border-border-soft/60 last:border-0 hover:bg-surface-2/30">
                  <td className="px-4 py-3">
                    <Link href={`/ads/${c.id}`} className="font-medium text-fg hover:text-primary">{c.title}</Link>
                    <p className="text-xs text-fg-faint">{c.campaignNumber} · {formatDate(c.createdAt)}</p>
                  </td>
                  <td className="px-4 py-3 text-fg-muted">{c.advertiser.name}</td>
                  <td className="px-4 py-3 text-fg-muted">{AD_TYPE_META[c.adType]?.label}</td>
                  <td className="px-4 py-3">
                    <span className="text-fg">{formatIQD(Number(c.amountDue))}</span>
                    <Badge tone={AD_PAYMENT_STATUS_META[c.paymentStatus]?.tone ?? "muted"} className="mr-1">{AD_PAYMENT_STATUS_META[c.paymentStatus]?.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-fg-muted">{c._count.impressions} / {c._count.clicks} · {ctr(c._count.impressions, c._count.clicks)}</td>
                  <td className="px-4 py-3"><Badge tone={CAMPAIGN_STATUS_META[c.status]?.tone ?? "muted"}>{CAMPAIGN_STATUS_META[c.status]?.label}</Badge></td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-fg-muted">لا توجد حملات بعد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}
