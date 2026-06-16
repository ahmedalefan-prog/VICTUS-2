"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guard";
import { recordAudit, logActivity } from "@/lib/audit";
import { assertServiceMember, resolveMyService } from "@/lib/services";

type Session = Awaited<ReturnType<typeof requirePermission>>;

async function requireMyService(session: Session) {
  const service = await resolveMyService(session.user.id);
  if (!service) throw new Error("لست عضواً في أي خدمة");
  return service;
}

const num = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().nonnegative("قيمة غير صالحة").optional(),
);

const itemSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  name: z.string().min(2, "اسم العنصر مطلوب"),
  description: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("رابط صورة غير صالح").optional().or(z.literal("")),
  category: z.string().optional().or(z.literal("")),
  condition: z.enum(["NEW", "USED", "REFURBISHED"]).optional().or(z.literal("")),
  priceNormal: z.preprocess((v) => Number(v), z.number().nonnegative("سعر غير صالح")),
  priceVip: num,
  unit: z.string().optional().or(z.literal("")),
  stock: num,
});

export async function saveCatalogItem(formData: FormData): Promise<void> {
  const session = await requirePermission("services", "VIEW");
  const service = await requireMyService(session);
  await assertServiceMember(service.id, session);

  const parsed = itemSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  const actorName = session.user.name ?? session.user.email ?? "عضو";
  const condition = d.condition || null;

  if (d.id) {
    const existing = await prisma.catalogItem.findUnique({ where: { id: d.id } });
    if (!existing || existing.serviceId !== service.id) throw new Error("العنصر غير موجود");

    const changes: { field: string; oldValue: number | null; newValue: number | null }[] = [];
    const oldNormal = Number(existing.priceNormal);
    if (oldNormal !== d.priceNormal) changes.push({ field: "priceNormal", oldValue: oldNormal, newValue: d.priceNormal });
    const oldVip = existing.priceVip === null ? null : Number(existing.priceVip);
    const newVip = d.priceVip ?? null;
    if (oldVip !== newVip) changes.push({ field: "priceVip", oldValue: oldVip, newValue: newVip });
    const oldStock = existing.stock === null ? null : Number(existing.stock);
    const newStock = d.stock ?? null;
    if (oldStock !== newStock) changes.push({ field: "stock", oldValue: oldStock, newValue: newStock });

    await prisma.$transaction(async (tx) => {
      await tx.catalogItem.update({
        where: { id: d.id! },
        data: {
          name: d.name,
          description: d.description || null,
          imageUrl: d.imageUrl || null,
          category: d.category || null,
          condition: condition as never,
          priceNormal: d.priceNormal,
          priceVip: d.priceVip ?? null,
          unit: d.unit || null,
          stock: d.stock ?? null,
        },
      });
      for (const c of changes) {
        await tx.priceChangeLog.create({
          data: { catalogItemId: d.id!, serviceId: service.id, actorId: session.user.id, actorName, field: c.field, oldValue: c.oldValue, newValue: c.newValue },
        });
      }
    });
    await logActivity({ actorId: session.user.id, verb: "catalog.updated", summary: `عدّل عنصر الكتالوج: ${d.name}`, entityType: "CatalogItem", entityId: d.id });
  } else {
    const created = await prisma.catalogItem.create({
      data: {
        serviceId: service.id,
        name: d.name,
        description: d.description || null,
        imageUrl: d.imageUrl || null,
        category: d.category || null,
        condition: condition as never,
        priceNormal: d.priceNormal,
        priceVip: d.priceVip ?? null,
        unit: d.unit || null,
        stock: d.stock ?? null,
      },
    });
    await logActivity({ actorId: session.user.id, verb: "catalog.created", summary: `أضاف عنصراً للكتالوج: ${d.name}`, entityType: "CatalogItem", entityId: created.id });
  }

  await recordAudit({ actorId: session.user.id, action: "catalog.save", entityType: "Service", entityId: service.id });
  revalidatePath("/console");
}

export async function deleteCatalogItem(itemId: string): Promise<void> {
  const session = await requirePermission("services", "VIEW");
  const service = await requireMyService(session);
  await assertServiceMember(service.id, session);
  const item = await prisma.catalogItem.findUnique({ where: { id: itemId }, select: { serviceId: true, name: true } });
  if (!item || item.serviceId !== service.id) throw new Error("العنصر غير موجود");

  await prisma.catalogItem.delete({ where: { id: itemId } });
  await logActivity({ actorId: session.user.id, verb: "catalog.deleted", summary: `حذف عنصراً من الكتالوج: ${item.name}`, entityType: "CatalogItem", entityId: itemId });
  revalidatePath("/console");
}

export async function toggleCatalogItemActive(itemId: string, isActive: boolean): Promise<void> {
  const session = await requirePermission("services", "VIEW");
  const service = await requireMyService(session);
  await assertServiceMember(service.id, session);
  const item = await prisma.catalogItem.findUnique({ where: { id: itemId }, select: { serviceId: true } });
  if (!item || item.serviceId !== service.id) throw new Error("العنصر غير موجود");
  await prisma.catalogItem.update({ where: { id: itemId }, data: { isActive } });
  revalidatePath("/console");
}
