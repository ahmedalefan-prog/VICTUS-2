// VICTUS — Role Based Access Control (service-platform model)
// Central source of truth for resources, actions, account types, and role templates.

export const PERMISSION_ACTIONS = [
  "VIEW",
  "CREATE",
  "EDIT",
  "DELETE",
  "MANAGE",
  "EXPORT",
] as const;

export type PermissionAction = (typeof PERMISSION_ACTIONS)[number];

// Every protected section. Permissions are <resource>:<action>.
export const RESOURCES = [
  { key: "dashboard", label: "لوحة التحكم" },
  // admin-owned services: VIEW = browse catalog (everyone) · CREATE = request (clinics/doctors)
  { key: "lab", label: "خدمة المختبر" },
  { key: "market", label: "خدمة السوق" },
  { key: "maintenance", label: "خدمة الصيانة" },
  // service console (team management) — runtime-scoped via ServiceMember
  { key: "services", label: "كونسول الخدمة" },
  { key: "transactions", label: "سجل معاملات الخدمات" },
  // supporting layers
  { key: "jobs", label: "الوظائف والتوظيف" },
  { key: "candidate", label: "ملف المرشّح" },
  { key: "ads", label: "الإعلانات" },
  { key: "advertisers", label: "المعلنون" },
  { key: "hr", label: "الموارد البشرية" },
  { key: "clinics", label: "العيادات" },
  { key: "devices", label: "الأجهزة" },
  { key: "brands", label: "العلامات التجارية" },
  // administration
  { key: "users", label: "المستخدمون" },
  { key: "approvals", label: "مراجعة الحسابات" },
  { key: "roles", label: "الأدوار والصلاحيات" },
  { key: "governorates", label: "المحافظات" },
  { key: "reports", label: "التقارير" },
  { key: "audit", label: "سجل العمليات" },
  { key: "settings", label: "إعدادات النظام" },
  // baseline horizontals
  { key: "notifications", label: "الإشعارات" },
  { key: "activity", label: "سجل النشاطات" },
  { key: "media", label: "مكتبة الملفات" },
] as const;

export type ResourceKey = (typeof RESOURCES)[number]["key"];
export type PermissionKey = `${ResourceKey}:${PermissionAction}`;

export function permKey(resource: string, action: PermissionAction): PermissionKey {
  return `${resource}:${action}` as PermissionKey;
}

// Account types → default system role on approval.
export const ACCOUNT_TYPES = [
  { value: "SUPER_ADMIN", label: "مدير عام", roleKey: "super_admin" },
  { value: "CLINIC_OWNER", label: "صاحب عيادة", roleKey: "clinic_owner" },
  { value: "DENTIST", label: "طبيب أسنان", roleKey: "dentist" },
  { value: "SERVICE_MEMBER", label: "عضو فريق خدمة", roleKey: "service_member" },
  { value: "JOB_SEEKER", label: "باحث عن عمل", roleKey: "job_seeker" },
  { value: "ADVERTISER", label: "معلن", roleKey: "advertiser" },
] as const;

export type AccountTypeValue = (typeof ACCOUNT_TYPES)[number]["value"];

// Self-registerable types (SUPER_ADMIN + SERVICE_MEMBER are admin-assigned).
export const REGISTERABLE_ACCOUNT_TYPES = ACCOUNT_TYPES.filter(
  (t) => t.value !== "SUPER_ADMIN" && t.value !== "SERVICE_MEMBER",
);

export const ACCOUNT_STATUSES = [
  { value: "PENDING", label: "بانتظار المراجعة", tone: "warning" },
  { value: "APPROVED", label: "مقبول", tone: "success" },
  { value: "REJECTED", label: "مرفوض", tone: "danger" },
  { value: "SUSPENDED", label: "معلّق", tone: "muted" },
] as const;

type RoleTemplate = Record<string, PermissionAction[] | "*">;

export const ROLE_TEMPLATES: Record<string, { name: string; perms: RoleTemplate }> = {
  super_admin: { name: "مدير عام", perms: { "*": "*" } },
  clinic_owner: {
    name: "صاحب عيادة",
    perms: {
      dashboard: ["VIEW"],
      lab: ["VIEW", "CREATE"],
      market: ["VIEW", "CREATE"],
      maintenance: ["VIEW", "CREATE"],
      clinics: ["VIEW", "CREATE", "EDIT", "MANAGE"],
      devices: ["VIEW", "CREATE", "EDIT", "DELETE"],
      jobs: ["VIEW", "CREATE", "EDIT"],
      ads: ["VIEW", "CREATE", "EDIT"],
      notifications: ["VIEW"],
    },
  },
  dentist: {
    name: "طبيب أسنان",
    perms: {
      dashboard: ["VIEW"],
      lab: ["VIEW", "CREATE"],
      market: ["VIEW", "CREATE"],
      maintenance: ["VIEW", "CREATE"],
      jobs: ["VIEW", "CREATE"],
      notifications: ["VIEW"],
    },
  },
  service_member: {
    name: "عضو فريق خدمة",
    perms: {
      dashboard: ["VIEW"],
      services: ["VIEW", "MANAGE"],
      hr: ["VIEW", "CREATE", "EDIT", "DELETE", "MANAGE"],
      jobs: ["VIEW", "CREATE", "EDIT"],
      notifications: ["VIEW"],
    },
  },
  job_seeker: {
    name: "باحث عن عمل",
    perms: {
      dashboard: ["VIEW"],
      jobs: ["VIEW"],
      notifications: ["VIEW"],
    },
  },
  advertiser: {
    name: "معلن",
    perms: {
      dashboard: ["VIEW"],
      ads: ["VIEW", "CREATE", "EDIT"],
      advertisers: ["VIEW", "EDIT"],
      notifications: ["VIEW"],
    },
  },
};

// Baseline permissions every approved member gets (browse-only horizontals).
const BASELINE_PERMS: RoleTemplate = {
  dashboard: ["VIEW"],
  notifications: ["VIEW"],
  activity: ["VIEW"],
  media: ["VIEW", "CREATE"],
  // service catalogs are browsable by everyone (ordering gated by CREATE);
  // maintenance has no public catalog — VIEW only opens the page (queue is
  // gated to team/admin server-side, requesters see their own requests).
  lab: ["VIEW"],
  market: ["VIEW"],
  maintenance: ["VIEW"],
  // jobs board + candidate profile open to all
  jobs: ["VIEW"],
  candidate: ["VIEW", "CREATE", "EDIT"],
  // brands directory browsable by everyone
  brands: ["VIEW"],
};

export function templatePermissionKeys(template: RoleTemplate): Set<string> {
  const set = new Set<string>();
  for (const [resource, actions] of Object.entries(template)) {
    if (resource === "*" || actions === "*") {
      for (const r of RESOURCES) {
        for (const a of PERMISSION_ACTIONS) set.add(permKey(r.key, a));
      }
      return set;
    }
    for (const a of actions as PermissionAction[]) set.add(permKey(resource, a));
  }
  for (const [resource, actions] of Object.entries(BASELINE_PERMS)) {
    for (const a of actions as PermissionAction[]) set.add(permKey(resource, a));
  }
  return set;
}

export function can(
  perms: Set<string> | string[],
  resource: string,
  action: PermissionAction,
): boolean {
  const set = perms instanceof Set ? perms : new Set(perms);
  return set.has(permKey(resource, action));
}
