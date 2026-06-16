import { prisma } from "@/lib/prisma";

// ─────────────────────── System Settings ───────────────────────
// Key-value platform configuration. Defaults defined here and seeded.

export interface SettingDef {
  key: string;
  group: string;
  label: string;
  value: unknown;
}

export const DEFAULT_SETTINGS: SettingDef[] = [
  { key: "platform.name", group: "general", label: "اسم المنصة", value: "VICTUS" },
  { key: "platform.country", group: "general", label: "الدولة", value: "العراق" },
  { key: "platform.currency", group: "general", label: "العملة", value: "IQD" },
  { key: "platform.calendar", group: "general", label: "التقويم", value: "gregorian" },
  { key: "registration.open", group: "access", label: "السماح بالتسجيل الجديد", value: true },
  { key: "registration.autoApprove", group: "access", label: "موافقة تلقائية على الحسابات", value: false },
  { key: "support.email", group: "contact", label: "بريد الدعم", value: "support@victus.iq" },
  { key: "support.phone", group: "contact", label: "هاتف الدعم", value: "" },
];

export async function getSetting<T = unknown>(key: string, fallback?: T): Promise<T> {
  const row = await prisma.systemSetting.findUnique({ where: { key } });
  if (!row) return fallback as T;
  return row.value as T;
}

export async function getSettingsByGroup() {
  const rows = await prisma.systemSetting.findMany({ orderBy: { key: "asc" } });
  const grouped: Record<string, typeof rows> = {};
  for (const r of rows) (grouped[r.group] ??= []).push(r);
  return grouped;
}

export async function setSetting(key: string, value: unknown) {
  const def = DEFAULT_SETTINGS.find((d) => d.key === key);
  return prisma.systemSetting.upsert({
    where: { key },
    update: { value: value as object },
    create: {
      key,
      group: def?.group ?? "general",
      label: def?.label ?? key,
      value: value as object,
    },
  });
}

export const GROUP_LABELS: Record<string, string> = {
  general: "عام",
  access: "الوصول والتسجيل",
  contact: "معلومات الاتصال",
};
