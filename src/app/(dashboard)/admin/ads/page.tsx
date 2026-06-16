import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { formatIQD, formatDate } from "@/lib/format";
import { AD_TYPE_META, AD_TYPES, placementsLabel } from "@/lib/ads";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ReviewActions, PricingForm } from "@/components/ads/review-controls";
import { Megaphone, ChevronLeft } from "lucide-react";

export const metadata = { title: "مراجعة الحملات" };

export default async function AdminAdsPage() {
  await requirePermission("ads", "MANAGE");

  const [pendingCampaigns, pricing] = await Promise.all([
    prisma.adCampaign.findMany({
      where: { status: "PENDING_REVIEW" },
      orderBy: { createdAt: "asc" },
      include: { advertiser: { select: { name: true } } },
    }),
    prisma.adPricing.findMany({ orderBy: { price: "desc" } }),
  ]);

  // Show a pricing form per ad type (existing rule or a blank default).
  const pricingByType = new Map(pricing.map((p) => [p.adType, p]));

  return (
    <>
      <PageHeader title="مراجعة الحملات الإعلانية" description="مراجعة الحملات وتأكيد الدفع وتفعيلها، وإدارة قواعد التسعير.">
        <Badge tone="warning">{pendingCampaigns.length} بانتظار المراجعة</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {pendingCampaigns.length === 0 ? (
            <Card className="flex flex-col items-center justify-center py-12 text-center">
              <Megaphone className="mb-3 h-9 w-9 text-fg-faint" />
              <p className="font-medium text-fg">لا توجد حملات بانتظار المراجعة</p>
            </Card>
          ) : (
            pendingCampaigns.map((c) => (
              <Card key={c.id} className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <Link href={`/ads/${c.id}`} className="font-medium text-fg hover:text-primary">{c.title}</Link>
                  <p className="text-xs text-fg-faint" dir="ltr">{c.campaignNumber} · {c.advertiser.name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-fg-muted">
                    <Badge tone="primary">{AD_TYPE_META[c.adType]?.label}</Badge>
                    <span>{placementsLabel(c.placements)}</span>
                    <span>· {formatDate(c.startDate)} ← {formatDate(c.endDate)}</span>
                    <span className="font-medium text-fg">المستحق: {formatIQD(Number(c.amountDue))}</span>
                  </div>
                </div>
                <ReviewActions campaignId={c.id} />
              </Card>
            ))
          )}
        </div>

        <Card className="h-fit">
          <h3 className="mb-3 font-semibold text-fg">قواعد التسعير (IQD)</h3>
          <div className="space-y-3">
            {AD_TYPES.map((t) => {
              const p = pricingByType.get(t as never) as { price: unknown; unit: string } | undefined;
              return (
                <PricingForm key={t} adType={t} price={p ? Number(p.price) : 0} unit={p?.unit ?? "WEEKLY"} label={AD_TYPE_META[t]?.label ?? t} />
              );
            })}
          </div>
          <Link href="/admin/revenue" className="mt-4 flex items-center gap-1 text-sm text-primary hover:underline">
            لوحة إيرادات الإعلانات <ChevronLeft className="h-3 w-3" />
          </Link>
        </Card>
      </div>
    </>
  );
}
