"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { recordAudit, logActivity } from "@/lib/audit";

type Session = Awaited<ReturnType<typeof requirePermission>>;

// A clinic (and its devices) is managed only by its owner — admins pass through.
async function assertClinicOwner(clinicId: string, session: Session) {
  const clinic = await prisma.clinic.findUnique({ where: { id: clinicId }, select: { ownerId: true, name: true } });
  if (!clinic) throw new Error("العيادة غير موجودة");
  if (!isPlatformAdmin(session) && clinic.ownerId !== session.user.id) throw new Error("لا تملك صلاحية على هذه العيادة");
  return clinic;
}

// ─────────────────────── clinics ───────────────────────

const clinicSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  name: z.string().min(2, "اسم العيادة مطلوب"),
  phone: z.string().max(40).optional().or(z.literal("")),
  address: z.string().max(300).optional().or(z.literal("")),
  governorateId: z.string().optional().or(z.literal("")),
});

export async function saveClinic(formData: FormData): Promise<void> {
  const session = await requirePermission("clinics", "CREATE");
  const parsed = clinicSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  const data = {
    name: d.name,
    phone: d.phone || null,
    address: d.address || null,
    governorateId: d.governorateId || null,
  };

  if (d.id) {
    await assertClinicOwner(d.id, session);
    await prisma.clinic.update({ where: { id: d.id }, data });
    await logActivity({ actorId: session.user.id, verb: "clinic.updated", summary: `عدّل عيادة: ${d.name}`, entityType: "Clinic", entityId: d.id });
  } else {
    const clinic = await prisma.clinic.create({ data: { ...data, ownerId: session.user.id } });
    await recordAudit({ actorId: session.user.id, action: "clinic.create", entityType: "Clinic", entityId: clinic.id });
    await logActivity({ actorId: session.user.id, verb: "clinic.created", summary: `أضاف عيادة: ${d.name}`, entityType: "Clinic", entityId: clinic.id });
  }
  revalidatePath("/clinics");
  revalidatePath("/devices");
}

export async function deleteClinic(clinicId: string): Promise<void> {
  const session = await requirePermission("clinics", "MANAGE");
  const clinic = await assertClinicOwner(clinicId, session);

  const orders = await prisma.maintenanceRequest.count({ where: { clinicId } });
  if (orders > 0) throw new Error("لا يمكن حذف عيادة مرتبطة بطلبات صيانة");

  await prisma.clinic.delete({ where: { id: clinicId } });
  await recordAudit({ actorId: session.user.id, action: "clinic.delete", entityType: "Clinic", entityId: clinicId });
  await logActivity({ actorId: session.user.id, verb: "clinic.deleted", summary: `حذف عيادة: ${clinic.name}`, entityType: "Clinic", entityId: clinicId });
  revalidatePath("/clinics");
  revalidatePath("/devices");
}

// ─────────────────────── devices ───────────────────────

const deviceSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  clinicId: z.string().min(1, "اختر العيادة"),
  name: z.string().min(2, "اسم الجهاز مطلوب"),
  brand: z.string().max(120).optional().or(z.literal("")),
  model: z.string().max(120).optional().or(z.literal("")),
  serial: z.string().max(120).optional().or(z.literal("")),
  warrantyEnd: z.string().optional().or(z.literal("")),
});

export async function saveDevice(formData: FormData): Promise<void> {
  const session = await requirePermission("devices", "CREATE");
  const parsed = deviceSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  // The target clinic must belong to the caller (or admin).
  await assertClinicOwner(d.clinicId, session);

  const data = {
    name: d.name,
    brand: d.brand || null,
    model: d.model || null,
    serial: d.serial || null,
    warrantyEnd: d.warrantyEnd ? new Date(d.warrantyEnd) : null,
  };

  if (d.id) {
    const existing = await prisma.device.findUnique({ where: { id: d.id }, select: { clinicId: true } });
    if (!existing) throw new Error("الجهاز غير موجود");
    await assertClinicOwner(existing.clinicId, session);
    await prisma.device.update({ where: { id: d.id }, data: { ...data, clinicId: d.clinicId } });
    await logActivity({ actorId: session.user.id, verb: "device.updated", summary: `عدّل جهازاً: ${d.name}`, entityType: "Device", entityId: d.id });
  } else {
    const device = await prisma.device.create({ data: { ...data, clinicId: d.clinicId } });
    await logActivity({ actorId: session.user.id, verb: "device.created", summary: `أضاف جهازاً: ${d.name}`, entityType: "Device", entityId: device.id });
  }
  revalidatePath("/devices");
  revalidatePath("/clinics");
}

export async function deleteDevice(deviceId: string): Promise<void> {
  const session = await requirePermission("devices", "DELETE");
  const device = await prisma.device.findUnique({ where: { id: deviceId }, select: { clinicId: true, name: true } });
  if (!device) throw new Error("الجهاز غير موجود");
  await assertClinicOwner(device.clinicId, session);

  const orders = await prisma.maintenanceRequest.count({ where: { deviceId } });
  if (orders > 0) throw new Error("لا يمكن حذف جهاز مرتبط بطلبات صيانة");

  await prisma.device.delete({ where: { id: deviceId } });
  await logActivity({ actorId: session.user.id, verb: "device.deleted", summary: `حذف جهازاً: ${device.name}`, entityType: "Device", entityId: deviceId });
  revalidatePath("/devices");
  revalidatePath("/clinics");
}
