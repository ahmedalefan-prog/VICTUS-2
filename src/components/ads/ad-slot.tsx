import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { isPlatformAdmin } from "@/lib/guard";
import { AD_PLACEMENT_ALL } from "@/lib/ads";
import { AdCreative, type AdCreativeData } from "@/components/ads/ad-creative";
import { AdPopup } from "@/components/ads/ad-popup";
import { Megaphone } from "lucide-react";

// Unified server component: renders the active, paid campaigns for a placement
// (max 4 per page), records an impression per ad actually shown. Clicks are
// tracked via /api/ads/[id]/click.
// Criteria: status=ACTIVE · paymentStatus=PAID · within dates · placement match · governorate.
export async function AdSlot({
  placement,
  governorate = null,
  limit = 4,
}: {
  placement: string;
  governorate?: string | null;
  limit?: number;
}) {
  const now = new Date();
  const session = await auth().catch(() => null);
  const isAdmin = session?.user ? isPlatformAdmin(session as { user: { permissions: string[] } }) : false;

  type AdRow = AdCreativeData & {
    id: string;
    status: string; paymentStatus: string; startDate: Date; endDate: Date; targetGovernorates: string | null;
    pinned: boolean; popup: boolean;
  };
  const all: AdRow[] = await prisma.adCampaign
    .findMany({
      where: { placements: { hasSome: [placement, AD_PLACEMENT_ALL] } },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true, title: true, imageUrl: true,
        mediaType: true, mediaUrls: true, thumbnailUrl: true,
        ctaType: true, ctaUrl: true, autoplayMuted: true, pinned: true, popup: true, wideBanner: true,
        status: true, paymentStatus: true, startDate: true, endDate: true, targetGovernorates: true,
      },
    })
    .catch(() => [] as AdRow[]);

  const eligible: AdRow[] = [];
  for (const c of all) {
    if (c.status !== "ACTIVE") continue;
    if (c.paymentStatus !== "PAID") continue;
    if (c.startDate > now || c.endDate < now) continue;
    if (c.targetGovernorates && governorate && !c.targetGovernorates.split(",").map((s) => s.trim()).includes(governorate)) continue;
    eligible.push(c);
  }

  const shown = eligible.slice(0, limit);

  if (shown.length === 0) {
    if (isAdmin) {
      return (
        <div className="mb-5 rounded-[var(--radius)] border border-dashed border-border bg-surface-2/30 px-4 py-3 text-center text-xs text-fg-faint print:hidden">
          لا توجد إعلانات نشطة لهذا الموضع ({placement}){all.length > 0 ? ` — ${all.length} حملة مستبعَدة` : ""}
        </div>
      );
    }
    return null;
  }

  await prisma.adImpression.createMany({ data: shown.map((c) => ({ campaignId: c.id, governorate })) }).catch(() => {});

  const popupAd = shown.find((c) => c.popup);
  const inline = shown.filter((c) => !c.popup);
  const wide = inline.filter((c) => c.wideBanner);
  const normal = inline.filter((c) => !c.wideBanner);

  const toData = (c: AdRow): AdCreativeData => ({
    title: c.title, mediaType: c.mediaType, mediaUrls: c.mediaUrls, thumbnailUrl: c.thumbnailUrl,
    ctaType: c.ctaType, ctaUrl: c.ctaUrl, autoplayMuted: c.autoplayMuted, wideBanner: c.wideBanner,
  });
  const href = (id: string) => `/api/ads/${id}/click`;

  return (
    <div className="mb-5 space-y-3 print:hidden">
      <p className="flex items-center gap-1.5 text-xs text-fg-faint">
        <Megaphone className="h-3.5 w-3.5" /> محتوى مموّل
      </p>

      {wide.map((c) => <AdCreative key={c.id} data={toData(c)} clickHref={href(c.id)} />)}

      {normal.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {normal.map((c) => <AdCreative key={c.id} data={toData(c)} clickHref={href(c.id)} />)}
        </div>
      )}

      {popupAd && <AdPopup data={toData(popupAd)} clickHref={href(popupAd.id)} campaignId={popupAd.id} />}
    </div>
  );
}
