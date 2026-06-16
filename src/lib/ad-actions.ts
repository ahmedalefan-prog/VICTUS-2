"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { recordAudit, logActivity } from "@/lib/audit";
import {
  AD_TYPES,
  AD_LEAD_TYPES,
  AD_TYPE_META,
  computeAmount,
  AD_PLACEMENT_KEYS,
  AD_PLACEMENT_ALL,
  AD_MEDIA_TYPES,
  AD_CTA_TYPES,
  isVideoUrl,
} from "@/lib/ads";

type Session = Awaited<ReturnType<typeof requirePermission>>;

async function nextCampaignNumber(): Promise<string> {
  const count = await prisma.adCampaign.count();
  return `CMP-${String(count + 1).padStart(5, "0")}`;
}

async function loadCampaign(id: string) {
  const c = await prisma.adCampaign.findUnique({ where: { id }, include: { advertiser: { select: { userId: true } } } });
  if (!c) throw new Error("الحملة غير موجودة");
  return c;
}

function canManage(session: Session, c: { advertiser: { userId: string } }) {
  return isPlatformAdmin(session) || c.advertiser.userId === session.user.id;
}

const schema = z.object({
  adType: z.enum(AD_TYPES as [string, ...string[]]).default("BANNER"),
  placements: z.string().min(1, "اختر مكان عرض واحداً على الأقل"),
  title: z.string().min(3, "عنوان الحملة مطلوب"),
  targetUrl: z.string().optional().or(z.literal("")),
  targetEntityId: z.string().optional().or(z.literal("")),
  budget: z.coerce.number().min(0).default(0),
  startDate: z.string().min(1, "تاريخ البدء مطلوب"),
  endDate: z.string().min(1, "تاريخ الانتهاء مطلوب"),
  targetGovernorates: z.string().optional().or(z.literal("")),
  mediaType: z.enum(AD_MEDIA_TYPES as [string, ...string[]]).default("SINGLE_IMAGE"),
  mediaUrls: z.string().optional().or(z.literal("")), // JSON array
  thumbnailUrl: z.string().optional().or(z.literal("")),
  ctaType: z.string().optional().or(z.literal("")),
  ctaUrl: z.string().optional().or(z.literal("")),
  autoplayMuted: z.string().optional(),
  pinned: z.string().optional(),
  popup: z.string().optional(),
  wideBanner: z.string().optional(),
});

// Returns { id } | { error } — Next hides thrown errors from actions in prod.
export async function createCampaign(formData: FormData): Promise<{ id: string } | { error: string }> {
  const session = await requirePermission("ads", "CREATE");
  const raw = Object.fromEntries(formData) as Record<string, string>;

  try {
    const existing = await prisma.advertiser.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    const advertiser = existing ?? (await prisma.advertiser.create({ data: { userId: session.user.id, name: session.user.name ?? "معلن" } }));

    const parsed = schema.safeParse(raw);
    if (!parsed.success) return { error: parsed.error.issues[0].message };
    const d = parsed.data;

    const start = new Date(d.startDate);
    const end = new Date(d.endDate);
    if (isNaN(start.getTime())) return { error: "تاريخ البدء غير صالح" };
    if (isNaN(end.getTime())) return { error: "تاريخ الانتهاء غير صالح" };
    if (end <= start) return { error: "تاريخ الانتهاء يجب أن يكون بعد البدء" };

    const budget = Number.isFinite(d.budget) ? d.budget : 0;
    const govCodes = (d.targetGovernorates ?? "").split(",").map((s) => s.trim()).filter(Boolean);

    const rawPlacements = d.placements.split(",").map((s) => s.trim()).filter(Boolean);
    let placements: string[];
    if (rawPlacements.includes(AD_PLACEMENT_ALL)) placements = [AD_PLACEMENT_ALL];
    else placements = [...new Set(rawPlacements.filter((k) => AD_PLACEMENT_KEYS.includes(k)))];
    if (placements.length === 0) return { error: "اختر مكان عرض واحداً على الأقل" };

    let mediaUrls: string[] = [];
    try {
      const parsedMedia = JSON.parse(d.mediaUrls || "[]");
      if (Array.isArray(parsedMedia)) mediaUrls = parsedMedia.map((x) => String(x).trim()).filter(Boolean);
    } catch { mediaUrls = []; }
    mediaUrls = [...new Set(mediaUrls)].slice(0, 10);
    const ctaType = d.ctaType && AD_CTA_TYPES.includes(d.ctaType) ? d.ctaType : null;
    const firstImage = mediaUrls.find((u) => !isVideoUrl(u)) ?? null;

    const pricing = await prisma.adPricing.findUnique({ where: { adType: d.adType as never } });
    const amountDue = pricing ? computeAmount(Number(pricing.price), pricing.unit, start, end) : 0;
    const entityType = AD_TYPE_META[d.adType]?.entityType ?? null;
    const campaignNumber = await nextCampaignNumber();

    const campaign = await prisma.adCampaign.create({
      data: {
        campaignNumber,
        advertiserId: advertiser.id,
        adType: d.adType as never,
        placements,
        title: d.title,
        imageUrl: firstImage,
        targetUrl: d.targetUrl || null,
        mediaType: d.mediaType,
        mediaUrls,
        thumbnailUrl: d.thumbnailUrl || null,
        ctaType,
        ctaUrl: d.ctaUrl || null,
        autoplayMuted: d.autoplayMuted === "1",
        pinned: d.pinned === "1",
        popup: d.popup === "1",
        wideBanner: d.wideBanner === "1",
        targetEntityType: entityType,
        targetEntityId: entityType && d.targetEntityId ? d.targetEntityId : null,
        budget,
        amountDue,
        startDate: start,
        endDate: end,
        targetGovernorates: govCodes.length ? govCodes.join(",") : null,
        status: "DRAFT",
      },
    });

    await recordAudit({ actorId: session.user.id, action: "ad.create", entityType: "AdCampaign", entityId: campaign.id });
    await logActivity({ actorId: session.user.id, verb: "ad.created", summary: `أنشأ حملة إعلانية: ${campaign.title}`, entityType: "AdCampaign", entityId: campaign.id });
    revalidatePath("/ads");
    return { id: campaign.id };
  } catch (e) {
    console.error("[createCampaign] failed:", e);
    return { error: `فشل إنشاء الحملة: ${e instanceof Error ? e.message : String(e)}` };
  }
}

export async function submitForReview(id: string): Promise<void> {
  const session = await requirePermission("ads", "EDIT");
  const c = await loadCampaign(id);
  if (!canManage(session, c)) throw new Error("لا تملك صلاحية");
  await prisma.adCampaign.update({ where: { id }, data: { status: "PENDING_REVIEW", paymentStatus: "PENDING_REVIEW" } });
  await recordAudit({ actorId: session.user.id, action: "ad.submit", entityType: "AdCampaign", entityId: id });
  revalidatePath(`/ads/${id}`);
  revalidatePath("/admin/ads");
}

export async function setCampaignPaused(id: string, paused: boolean): Promise<void> {
  const session = await requirePermission("ads", "EDIT");
  const c = await loadCampaign(id);
  if (!canManage(session, c)) throw new Error("لا تملك صلاحية");
  if (!["ACTIVE", "PAUSED"].includes(c.status)) throw new Error("الحملة ليست نشطة");
  await prisma.adCampaign.update({ where: { id }, data: { status: paused ? "PAUSED" : "ACTIVE" } });
  revalidatePath(`/ads/${id}`);
}

const leadSchema = z.object({
  campaignId: z.string().min(1),
  type: z.enum(AD_LEAD_TYPES as [string, ...string[]]).default("INQUIRY"),
  value: z.coerce.number().min(0).optional(),
  note: z.string().optional().or(z.literal("")),
});

export async function recordLead(formData: FormData): Promise<void> {
  const session = await requirePermission("ads", "EDIT");
  const parsed = leadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  const c = await loadCampaign(d.campaignId);
  if (!canManage(session, c)) throw new Error("لا تملك صلاحية");
  await prisma.adLead.create({ data: { campaignId: d.campaignId, type: d.type as never, value: d.value ?? null, note: d.note || null } });
  revalidatePath(`/ads/${d.campaignId}`);
}
