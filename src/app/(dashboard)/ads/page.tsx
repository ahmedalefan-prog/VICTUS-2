import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatIQD } from "@/lib/format";
import { AD_TYPE_META, CAMPAIGN_STATUS_META, ctr, placementsLabel } from "@/lib/ads";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Megaphone, ChevronLeft } from "lucide-react";
import { CampaignForm } from "@/components/ads/campaign-form";

export const metadata = { title: "حملاتي الإعلانية" };

export default async function AdsPage() {
  const session = await requirePermission("ads", "VIEW");
  const canCreate = can(session.user.permissions, "ads", "CREATE");

  const advertiser = await prisma.advertiser.findUnique({ where: { userId: session.user.id } });
  const [campaigns, governorates, pricing] = await Promise.all([
    advertiser
      ? prisma.adCampaign.findMany({
          where: { advertiserId: advertiser.id },
          orderBy: { createdAt: "desc" },
          include: { _count: { select: { impressions: true, clicks: true, leads: true } } },
        })
      : Promise.resolve([]),
    prisma.governorate.findMany({ orderBy: { nameAr: "asc" }, select: { code: true, nameAr: true } }),
    prisma.adPricing.findMany({ where: { isActive: true }, select: { adType: true, price: true, unit: true } }),
  ]);

  return (
    <>
      <PageHeader title="حملاتي الإعلانية" description="روّج لمنتجاتك ووظائفك وخدماتك على منصّة VICTUS.">
        <Badge tone="primary">{campaigns.length} حملة</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className={canCreate ? "lg:col-span-2" : "lg:col-span-3"}>
          {campaigns.length === 0 ? (
            <EmptyState icon={<Megaphone className="h-7 w-7" />} title="لا توجد حملات بعد" description="أنشئ حملتك الأولى من النموذج المجاور." />
          ) : (
            <>
            {/* بطاقات (جوال) */}
            <div className="space-y-3 md:hidden">
              {campaigns.map((c) => {
                const st = CAMPAIGN_STATUS_META[c.status];
                return (
                  <Link key={c.id} href={`/ads/${c.id}`} className="group block">
                    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_20px_-8px_var(--primary)]">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-fg transition-colors group-hover:text-primary">{c.title}</p>
                          <p className="truncate text-xs text-fg-faint">{c.campaignNumber} · {placementsLabel(c.placements)}</p>
                        </div>
                        <Badge tone={st?.tone ?? "muted"}>{st?.label}</Badge>
                      </div>
                      <div className="mt-3">
                        <Badge tone="primary">{AD_TYPE_META[c.adType]?.label}</Badge>
                      </div>
                      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border-soft/60 pt-3 text-center">
                        <div>
                          <p className="text-sm font-bold text-fg">{c._count.impressions}</p>
                          <p className="text-[11px] text-fg-faint">مشاهدة</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-fg">{c._count.clicks}</p>
                          <p className="text-[11px] text-fg-faint">نقرة</p>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-fg">{ctr(c._count.impressions, c._count.clicks)}</p>
                          <p className="text-[11px] text-fg-faint">CTR</p>
                        </div>
                      </div>
                      <p className="mt-2 text-center text-xs text-fg-muted">{c._count.leads} عميل محتمل</p>
                    </Card>
                  </Link>
                );
              })}
            </div>

            {/* جدول (ديسكتوب) */}
            <Card className="hidden p-0 md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-soft text-right text-xs text-fg-faint">
                      <th className="px-4 py-3 font-medium">الحملة</th>
                      <th className="px-4 py-3 font-medium">النوع</th>
                      <th className="px-4 py-3 font-medium">الأداء</th>
                      <th className="px-4 py-3 font-medium">الحالة</th>
                      <th className="px-4 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {campaigns.map((c) => {
                      const st = CAMPAIGN_STATUS_META[c.status];
                      return (
                        <tr key={c.id} className="border-b border-border-soft/60 last:border-0 hover:bg-surface-2/30">
                          <td className="px-4 py-3">
                            <p className="font-medium text-fg">{c.title}</p>
                            <p className="text-xs text-fg-faint">{c.campaignNumber} · {placementsLabel(c.placements)}</p>
                          </td>
                          <td className="px-4 py-3 text-fg-muted">{AD_TYPE_META[c.adType]?.label}</td>
                          <td className="px-4 py-3 text-xs text-fg-muted">
                            {c._count.impressions} مشاهدة · {c._count.clicks} نقرة · CTR {ctr(c._count.impressions, c._count.clicks)}
                            <span className="block text-fg-faint">{c._count.leads} عميل محتمل</span>
                          </td>
                          <td className="px-4 py-3"><Badge tone={st?.tone ?? "muted"}>{st?.label}</Badge></td>
                          <td className="px-4 py-3">
                            <Link href={`/ads/${c.id}`} className="flex items-center gap-0.5 text-xs font-medium text-primary hover:underline">تفاصيل <ChevronLeft className="h-3 w-3" /></Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
            </>
          )}
        </div>

        {canCreate && (
          <Card className="h-fit">
            <h3 className="mb-1 font-semibold text-fg">حملة جديدة</h3>
            {pricing.length > 0 && (
              <p className="mb-3 text-xs text-fg-faint">
                الأسعار: {pricing.map((p) => `${AD_TYPE_META[p.adType]?.label} ${formatIQD(Number(p.price))}/${p.unit === "MONTHLY" ? "شهر" : "أسبوع"}`).slice(0, 2).join("، ")}…
              </p>
            )}
            <CampaignForm governorates={governorates} />
          </Card>
        )}
      </div>
    </>
  );
}
