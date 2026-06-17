"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guard";
import { recordAudit, logActivity } from "@/lib/audit";

const brandSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  name: z.string().min(2, "اسم العلامة مطلوب"),
  category: z.string().max(120).optional().or(z.literal("")),
  country: z.string().max(120).optional().or(z.literal("")),
  website: z.string().url("رابط غير صالح").optional().or(z.literal("")),
  logoUrl: z.string().url("رابط شعار غير صالح").optional().or(z.literal("")),
  about: z.string().max(2000).optional().or(z.literal("")),
});

export async function saveBrand(formData: FormData): Promise<void> {
  const session = await requirePermission("brands", "MANAGE");
  const parsed = brandSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  const data = {
    name: d.name,
    category: d.category || null,
    country: d.country || null,
    website: d.website || null,
    logoUrl: d.logoUrl || null,
    about: d.about || null,
  };

  if (d.id) {
    await prisma.brand.update({ where: { id: d.id }, data });
    await logActivity({ actorId: session.user.id, verb: "brand.updated", summary: `عدّل علامة: ${d.name}`, entityType: "Brand", entityId: d.id });
  } else {
    const brand = await prisma.brand.create({ data });
    await recordAudit({ actorId: session.user.id, action: "brand.create", entityType: "Brand", entityId: brand.id });
    await logActivity({ actorId: session.user.id, verb: "brand.created", summary: `أضاف علامة: ${d.name}`, entityType: "Brand", entityId: brand.id });
  }
  revalidatePath("/admin/brands");
  revalidatePath("/brands");
}

export async function toggleBrandActive(id: string, isActive: boolean): Promise<void> {
  await requirePermission("brands", "MANAGE");
  await prisma.brand.update({ where: { id }, data: { isActive } });
  revalidatePath("/admin/brands");
  revalidatePath("/brands");
}

export async function deleteBrand(id: string): Promise<void> {
  const session = await requirePermission("brands", "MANAGE");
  await prisma.brand.delete({ where: { id } });
  await recordAudit({ actorId: session.user.id, action: "brand.delete", entityType: "Brand", entityId: id });
  revalidatePath("/admin/brands");
  revalidatePath("/brands");
}
