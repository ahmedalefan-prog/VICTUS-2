import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { formatIQD } from "@/lib/format";
import { AD_TYPE_META, CAMPAIGN_STATUS_META, ctr, placementsLabel } from "@/lib/ads";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
            <Card className="flex flex-col items-center justify-center py-16 text-center">
              <Megaphone className="mb-3 h-10 w-10 text-fg-faint" />
              <p className="font-medium text-fg">لا توجد حملات بعد</p>
              <p className="mt-1 text-sm text-fg-muted">أنشئ حملتك الأولى من النموذج المجاور.</p>
            </Card>
          ) : (
            <Card className="p-0">
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
