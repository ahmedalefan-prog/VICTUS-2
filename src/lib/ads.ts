// Client-safe ads metadata (no prisma/server imports). Ported from VICTUS-1,
// adapted to VICTUS-2 entities (CatalogItem / Job / Service) and pages.
import type { Badge } from "@/components/ui/badge";

type Tone = NonNullable<Parameters<typeof Badge>[0]["tone"]>;

// adType → label + the entity it sponsors (null for a free banner).
export const AD_TYPE_META: Record<string, { label: string; entityType: string | null }> = {
  BANNER: { label: "بانر إعلاني", entityType: null },
  SPONSORED_PRODUCT: { label: "منتج مميّز (السوق)", entityType: "CatalogItem" },
  SPONSORED_JOB: { label: "وظيفة مميّزة", entityType: "Job" },
  SPONSORED_SERVICE: { label: "خدمة مميّزة", entityType: "Service" },
};
export const AD_TYPES = Object.keys(AD_TYPE_META);

// Static ad placement catalog (no DB table). Stored on AdCampaign.placements as
// an array of keys. The special value "ALL" means every page.
export const AD_PLACEMENT_ALL = "ALL";
export const AD_PLACEMENTS: { key: string; label: string }[] = [
  { key: "DASHBOARD", label: "لوحة التحكم" },
  { key: "LAB", label: "المختبر" },
  { key: "MARKET", label: "السوق" },
  { key: "MAINTENANCE", label: "الصيانة" },
  { key: "JOBS", label: "الوظائف" },
];
export const AD_PLACEMENT_KEYS = AD_PLACEMENTS.map((p) => p.key);

export function placementLabel(key: string): string {
  if (key === AD_PLACEMENT_ALL) return "جميع الصفحات";
  return AD_PLACEMENTS.find((p) => p.key === key)?.label ?? key;
}

export function placementsLabel(keys: string[]): string {
  if (!keys || keys.length === 0) return "—";
  if (keys.includes(AD_PLACEMENT_ALL)) return "جميع الصفحات";
  return keys.map(placementLabel).join("، ");
}

export const CAMPAIGN_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "مسودة", tone: "muted" },
  PENDING_REVIEW: { label: "بانتظار المراجعة", tone: "warning" },
  ACTIVE: { label: "نشطة", tone: "success" },
  PAUSED: { label: "متوقفة", tone: "info" },
  COMPLETED: { label: "منتهية", tone: "muted" },
  REJECTED: { label: "مرفوضة", tone: "danger" },
};
export const CAMPAIGN_STATUSES = Object.keys(CAMPAIGN_STATUS_META);

export const AD_PAYMENT_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  UNPAID: { label: "غير مدفوع", tone: "danger" },
  PENDING_REVIEW: { label: "بانتظار تأكيد الدفع", tone: "warning" },
  PAID: { label: "مدفوع", tone: "success" },
};

export const AD_LEAD_TYPE_META: Record<string, { label: string }> = {
  IMPRESSION_GOAL: { label: "هدف مشاهدات" },
  CALL: { label: "اتصال" },
  INQUIRY: { label: "استفسار" },
  SALE: { label: "عملية بيع" },
};
export const AD_LEAD_TYPES = Object.keys(AD_LEAD_TYPE_META);

// ─────────────────────── ad media ───────────────────────
export const AD_MEDIA_TYPE_META: Record<string, { label: string; hint: string }> = {
  SINGLE_IMAGE: { label: "صورة واحدة", hint: "بطاقة بصورة واحدة" },
  CAROUSEL: { label: "معرض صور", hint: "عدة صور بشريط متحرّك" },
  VIDEO: { label: "فيديو", hint: "مشغّل فيديو داخل الإعلان" },
  MIXED: { label: "صورة + فيديو", hint: "الفيديو أولاً ثم الصور" },
};
export const AD_MEDIA_TYPES = Object.keys(AD_MEDIA_TYPE_META);

export const AD_CTA_META: Record<string, { label: string }> = {
  DETAILS: { label: "عرض التفاصيل" },
  VISIT: { label: "زيارة الصفحة" },
  CALL: { label: "اتصل الآن" },
  WHATSAPP: { label: "واتساب" },
  BOOK: { label: "حجز موعد" },
  BUY: { label: "شراء الآن" },
  APPLY: { label: "التقديم للوظيفة" },
};
export const AD_CTA_TYPES = Object.keys(AD_CTA_META);

export type VideoSource =
  | { kind: "youtube"; id: string; embedUrl: string }
  | { kind: "vimeo"; id: string; embedUrl: string }
  | { kind: "file"; embedUrl: string }
  | null;

// Parse a video URL into an embeddable source (YouTube / Vimeo / direct MP4).
export function parseVideoUrl(url: string): VideoSource {
  if (!url) return null;
  const u = url.trim();
  const yt = u.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  if (yt) return { kind: "youtube", id: yt[1], embedUrl: `https://www.youtube.com/embed/${yt[1]}` };
  const vm = u.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { kind: "vimeo", id: vm[1], embedUrl: `https://player.vimeo.com/video/${vm[1]}` };
  if (/\.(mp4|webm|mov)(\?.*)?$/i.test(u) || u.startsWith("blob:")) return { kind: "file", embedUrl: u };
  return null;
}

export function isVideoUrl(url: string): boolean {
  return parseVideoUrl(url) !== null;
}

// CTR % from impressions & clicks.
export function ctr(impressions: number, clicks: number): string {
  if (impressions === 0) return "0%";
  return `${((clicks / impressions) * 100).toFixed(1)}%`;
}

// Compute the campaign amount due from a pricing rule + duration.
export function computeAmount(price: number, unit: string, start: Date, end: Date): number {
  const ms = Math.max(0, end.getTime() - start.getTime());
  const days = Math.max(1, Math.ceil(ms / 86400000));
  const periods = unit === "MONTHLY" ? days / 30 : days / 7;
  return Math.round(price * Math.max(1, Math.ceil(periods)));
}
