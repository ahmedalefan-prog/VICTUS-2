// VICTUS — database seed (service-platform model)
// Seeds: Iraqi geography, permissions, system roles, settings, the Super Admin,
// and the three admin-owned services (Lab / Market / Maintenance).

import { PrismaClient, type PermissionAction } from "../src/generated/prisma";
import bcrypt from "bcryptjs";
import { IRAQ_GOVERNORATES } from "../src/lib/iraq";
import {
  RESOURCES,
  PERMISSION_ACTIONS,
  ROLE_TEMPLATES,
  templatePermissionKeys,
} from "../src/lib/rbac";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

async function seedGeography() {
  for (const gov of IRAQ_GOVERNORATES) {
    const g = await prisma.governorate.upsert({
      where: { code: gov.code },
      update: { nameAr: gov.nameAr, nameEn: gov.nameEn },
      create: { code: gov.code, nameAr: gov.nameAr, nameEn: gov.nameEn },
    });
    for (const d of gov.districts) {
      const exists = await prisma.district.findFirst({
        where: { governorateId: g.id, nameEn: d.nameEn },
      });
      if (!exists) {
        await prisma.district.create({
          data: { governorateId: g.id, nameAr: d.nameAr, nameEn: d.nameEn },
        });
      }
    }
  }
  console.log(`✓ Governorates: ${IRAQ_GOVERNORATES.length}`);
}

async function seedPermissions() {
  const ids = new Map<string, string>();
  for (const r of RESOURCES) {
    for (const a of PERMISSION_ACTIONS) {
      const p = await prisma.permission.upsert({
        where: { resource_action: { resource: r.key, action: a as PermissionAction } },
        update: {},
        create: { resource: r.key, action: a as PermissionAction },
      });
      ids.set(`${r.key}:${a}`, p.id);
    }
  }
  console.log(`✓ Permissions: ${ids.size}`);
  return ids;
}

async function seedRoles(permIds: Map<string, string>) {
  for (const [key, template] of Object.entries(ROLE_TEMPLATES)) {
    const role = await prisma.role.upsert({
      where: { key },
      update: { name: template.name, isSystem: true },
      create: { key, name: template.name, isSystem: true },
    });
    const wanted = templatePermissionKeys(template.perms);
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
    const data = [...wanted]
      .map((k) => permIds.get(k))
      .filter((id): id is string => Boolean(id))
      .map((permissionId) => ({ roleId: role.id, permissionId }));
    if (data.length) {
      await prisma.rolePermission.createMany({ data, skipDuplicates: true });
    }
  }
  console.log(`✓ Roles: ${Object.keys(ROLE_TEMPLATES).length}`);
}

async function seedSettings() {
  for (const s of DEFAULT_SETTINGS) {
    await prisma.systemSetting.upsert({
      where: { key: s.key },
      update: { label: s.label, group: s.group },
      create: { key: s.key, group: s.group, label: s.label, value: s.value as object },
    });
  }
  console.log(`✓ Settings: ${DEFAULT_SETTINGS.length}`);
}

async function seedSuperAdmin() {
  const email = (process.env.SEED_ADMIN_EMAIL ?? "admin@victus.iq").toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD ?? "Victus@2026";
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.upsert({
    where: { email },
    update: { status: "APPROVED", accountType: "SUPER_ADMIN" },
    create: {
      email,
      passwordHash,
      fullName: "مدير منصة VICTUS",
      accountType: "SUPER_ADMIN",
      status: "APPROVED",
      emailVerified: new Date(),
    },
  });

  const role = await prisma.role.findUnique({ where: { key: "super_admin" } });
  if (role) {
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
  }
  console.log(`✓ Super Admin: ${email}`);
  return user.id;
}

// The three admin-owned services (EXCLUSIVE), with the admin as MANAGER.
async function seedServices(adminId: string) {
  const services = [
    { type: "LAB" as const, name: "مختبر VICTUS الرسمي", about: "خدمة المختبر الحصرية للمنصة" },
    { type: "MARKET" as const, name: "سوق VICTUS الرسمي", about: "قطع الغيار والأجهزة" },
    { type: "MAINTENANCE" as const, name: "فريق الصيانة الرسمي", about: "خدمة الصيانة الداخلية" },
  ];
  for (const s of services) {
    const svc = await prisma.service.upsert({
      where: { type: s.type },
      update: { name: s.name, about: s.about },
      create: { type: s.type, name: s.name, about: s.about, mode: "EXCLUSIVE", isActive: true },
    });
    await prisma.serviceMember.upsert({
      where: { serviceId_userId: { serviceId: svc.id, userId: adminId } },
      update: { role: "MANAGER" },
      create: { serviceId: svc.id, userId: adminId, role: "MANAGER", title: "مدير الخدمة" },
    });
  }
  console.log(`✓ Services: ${services.length}`);
}

async function main() {
  console.log("Seeding VICTUS (service platform)…");
  await seedGeography();
  const permIds = await seedPermissions();
  await seedRoles(permIds);
  await seedSettings();
  const adminId = await seedSuperAdmin();
  await seedServices(adminId);
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
