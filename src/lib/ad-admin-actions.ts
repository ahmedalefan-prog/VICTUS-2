"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guard";
import { recordAudit } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications";
import { AD_TYPES } from "@/lib/ads";

async function loadCampaign(id: string) {
  const c = await prisma.adCampaign.findUnique({ where: { id }, include: { advertiser: { select: { userId: true } } } });
  if (!c) throw new Error("الحملة غير موجودة");
  return c;
}

export async function approveCampaign(id: string): Promise<void> {
  const session = await requirePermission("ads", "MANAGE");
  const c = await loadCampaign(id);
  await prisma.adCampaign.update({ where: { id }, data: { status: "ACTIVE", paymentStatus: "PAID" } });
  await recordAudit({ actorId: session.user.id, action: "ad.approve", entityType: "AdCampaign", entityId: id });
  await dispatchNotification({ event: "ad.approved", userId: c.advertiser.userId, data: { title: c.title }, link: `/ads/${id}` });
  revalidatePath("/admin/ads");
  revalidatePath(`/ads/${id}`);
}

export async function rejectCampaign(id: string, note?: string): Promise<void> {
  const session = await requirePermission("ads", "MANAGE");
  const c = await loadCampaign(id);
  await prisma.adCampaign.update({ where: { id }, data: { status: "REJECTED" } });
  await recordAudit({ actorId: session.user.id, action: "ad.reject", entityType: "AdCampaign", entityId: id, metadata: { note } });
  await dispatchNotification({ event: "ad.rejected", userId: c.advertiser.userId, data: { title: c.title }, link: `/ads/${id}` });
  revalidatePath("/admin/ads");
  revalidatePath(`/ads/${id}`);
}

export async function confirmPayment(id: string, ref: string): Promise<void> {
  const session = await requirePermission("ads", "MANAGE");
  await prisma.adCampaign.update({ where: { id }, data: { paymentStatus: "PAID", paymentRef: ref || null } });
  await recordAudit({ actorId: session.user.id, action: "ad.payment.confirm", entityType: "AdCampaign", entityId: id });
  revalidatePath("/admin/ads");
}

const pricingSchema = z.object({
  adType: z.enum(AD_TYPES as [string, ...string[]]),
  price: z.coerce.number().min(0),
  unit: z.enum(["WEEKLY", "MONTHLY"]).default("WEEKLY"),
});

export async function savePricing(formData: FormData): Promise<void> {
  const session = await requirePermission("ads", "MANAGE");
  const parsed = pricingSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  await prisma.adPricing.upsert({
    where: { adType: d.adType as never },
    update: { price: d.price, unit: d.unit },
    create: { adType: d.adType as never, price: d.price, unit: d.unit },
  });
  await recordAudit({ actorId: session.user.id, action: "ad.pricing.save", metadata: { adType: d.adType, price: d.price } });
  revalidatePath("/admin/ads");
}
