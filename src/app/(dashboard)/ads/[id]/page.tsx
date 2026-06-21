import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { formatIQD, formatDate, formatDateTime } from "@/lib/format";
import { AD_TYPE_META, CAMPAIGN_STATUS_META, AD_PAYMENT_STATUS_META, AD_LEAD_TYPE_META, ctr, placementsLabel } from "@/lib/ads";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronRight } from "lucide-react";
import { AdCreative } from "@/components/ads/ad-creative";
import { CampaignControls, LeadForm } from "@/components/ads/campaign-controls";

export const metadata = { title: "تفاصيل الحملة" };

export default async function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("ads", "VIEW");

  const c = await prisma.adCampaign.findUnique({
    where: { id },
    include: {
      advertiser: { select: { userId: true, name: true } },
      leads: { orderBy: { createdAt: "desc" }, take: 20 },
      _count: { select: { impressions: true, clicks: true, leads: true } },
    },
  });
  if (!c) notFound();

  const isOwner = c.advertiser.userId === session.user.id;
  const isAdmin = isPlatformAdmin(session);
  if (!isOwner && !isAdmin) notFound();

  const st = CAMPAIGN_STATUS_META[c.status];
  const pay = AD_PAYMENT_STATUS_META[c.paymentStatus];

  return (
    <>
      <Link href="/ads" className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronRight className="h-4 w-4" /> العودة للحملات
      </Link>

      <PageHeader title={c.title} description={`${c.campaignNumber} · ${AD_TYPE_META[c.adType]?.label}`}>
        <div className="flex items-center gap-2">
          <Badge tone={st?.tone ?? "muted"}>{st?.label}</Badge>
          <Badge tone={pay?.tone ?? "muted"}>{pay?.label}</Badge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Card className="text-center"><p className="text-xs text-fg-muted">مشاهدات</p><p className="mt-1 text-xl font-bold text-fg">{c._count.impressions}</p></Card>
            <Card className="text-center"><p className="text-xs text-fg-muted">نقرات</p><p className="mt-1 text-xl font-bold text-fg">{c._count.clicks}</p></Card>
            <Card className="text-center"><p className="text-xs text-fg-muted">CTR</p><p className="mt-1 text-xl font-bold text-primary">{ctr(c._count.impressions, c._count.clicks)}</p></Card>
          </div>

          <Card>
            <h3 className="mb-3 font-semibold text-fg">معاينة الإعلان</h3>
            <AdCreative data={{ title: c.title, mediaType: c.mediaType, mediaUrls: c.mediaUrls, thumbnailUrl: c.thumbnailUrl, ctaType: c.ctaType, ctaUrl: c.ctaUrl, autoplayMuted: c.autoplayMuted, wideBanner: c.wideBanner }} />
            <div className="mt-3 space-y-1 border-t border-border-soft pt-3 text-sm">
              <Row label="الصفحات" value={placementsLabel(c.placements)} />
              <Row label="المدة" value={`${formatDate(c.startDate)} ← ${formatDate(c.endDate)}`} />
              <Row label="المبلغ المستحق" value={formatIQD(Number(c.amountDue))} />
              {c.targetGovernorates && <Row label="استهداف المحافظات" value={c.targetGovernorates} />}
            </div>
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold text-fg">العملاء المحتملون ({c._count.leads})</h3>
            {c.leads.length === 0 ? (
              <EmptyState title="لا يوجد عملاء محتملون بعد." />
            ) : (
              <ul className="space-y-2">
                {c.leads.map((l) => (
                  <li key={l.id} className="flex items-center justify-between rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2 text-sm">
                    <span className="text-fg">{AD_LEAD_TYPE_META[l.type]?.label}{l.note ? ` — ${l.note}` : ""}</span>
                    <span className="text-xs text-fg-faint">{l.value ? formatIQD(Number(l.value)) : ""} · {formatDateTime(l.createdAt)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <CampaignControls campaignId={c.id} status={c.status} />
          <LeadForm campaignId={c.id} />
        </div>
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-fg-muted">{label}</span>
      <span className="font-medium text-fg">{value}</span>
    </div>
  );
}
