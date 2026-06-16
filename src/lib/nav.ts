import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FlaskConical,
  Store,
  Wrench,
  ClipboardCheck,
  Briefcase,
  UserRound,
  Megaphone,
  Tags,
  Building2,
  Stethoscope,
  Contact,
  Users,
  UserCheck,
  ShieldCheck,
  BarChart3,
  MapPin,
  ScrollText,
  Settings,
  Bell,
  Handshake,
} from "lucide-react";
import type { PermissionAction } from "@/lib/rbac";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  resource: string;
  action: PermissionAction;
  soon?: boolean;
}

export interface NavGroup {
  key: string;
  title: string;
  icon: LucideIcon;
  items: NavItem[];
}

export const DASHBOARD_NAV: NavItem = {
  label: "لوحة التحكم",
  href: "/dashboard",
  icon: LayoutDashboard,
  resource: "dashboard",
  action: "VIEW",
};

export const NAV_GROUPS: NavGroup[] = [
  {
    key: "services",
    title: "الخدمات",
    icon: Handshake,
    items: [
      { label: "المختبر", href: "/lab", icon: FlaskConical, resource: "lab", action: "VIEW" },
      { label: "السوق", href: "/market", icon: Store, resource: "market", action: "VIEW" },
      { label: "الصيانة", href: "/maintenance", icon: Wrench, resource: "maintenance", action: "VIEW" },
      { label: "كونسول الخدمة", href: "/console", icon: ClipboardCheck, resource: "services", action: "VIEW" },
    ],
  },
  {
    key: "hiring",
    title: "التوظيف",
    icon: Briefcase,
    items: [
      { label: "الوظائف", href: "/jobs", icon: Briefcase, resource: "jobs", action: "VIEW" },
      { label: "ملف المرشّح", href: "/candidate", icon: UserRound, resource: "candidate", action: "VIEW" },
    ],
  },
  {
    key: "marketing",
    title: "التسويق",
    icon: Megaphone,
    items: [
      { label: "حملاتي الإعلانية", href: "/ads", icon: Megaphone, resource: "ads", action: "VIEW" },
      { label: "العلامات التجارية", href: "/brands", icon: Tags, resource: "brands", action: "VIEW" },
    ],
  },
  {
    key: "clinic",
    title: "عيادتي",
    icon: Stethoscope,
    items: [
      { label: "العيادات", href: "/clinics", icon: Building2, resource: "clinics", action: "VIEW" },
      { label: "الأجهزة", href: "/devices", icon: Stethoscope, resource: "devices", action: "VIEW" },
      { label: "الموارد البشرية", href: "/hr", icon: Contact, resource: "hr", action: "VIEW" },
    ],
  },
  {
    key: "admin",
    title: "الإدارة",
    icon: Settings,
    items: [
      { label: "المستخدمون", href: "/admin/users", icon: Users, resource: "users", action: "VIEW" },
      { label: "مراجعة الحسابات", href: "/admin/approvals", icon: UserCheck, resource: "approvals", action: "VIEW" },
      { label: "الأدوار والصلاحيات", href: "/admin/roles", icon: ShieldCheck, resource: "roles", action: "VIEW" },
      { label: "معاملات الخدمات", href: "/admin/transactions", icon: ClipboardCheck, resource: "transactions", action: "VIEW" },
      { label: "مراجعة الإعلانات", href: "/admin/ads", icon: Megaphone, resource: "ads", action: "MANAGE" },
      { label: "إيرادات الإعلانات", href: "/admin/revenue", icon: BarChart3, resource: "reports", action: "VIEW" },
      { label: "المحافظات", href: "/admin/governorates", icon: MapPin, resource: "governorates", action: "VIEW" },
      { label: "إدارة العلامات", href: "/admin/brands", icon: Tags, resource: "brands", action: "MANAGE" },
      { label: "سجل العمليات", href: "/admin/audit", icon: ScrollText, resource: "audit", action: "VIEW" },
      { label: "إعدادات النظام", href: "/admin/settings", icon: Settings, resource: "settings", action: "VIEW" },
    ],
  },
];

export const STANDALONE_NAV = {
  notifications: { label: "الإشعارات", href: "/notifications", icon: Bell, resource: "notifications", action: "VIEW" as PermissionAction },
};

// Mobile bottom-bar candidates (by priority) — fills 2 dynamic slots per user.
export const MOBILE_NAV_PRIORITY: NavItem[] = [
  { label: "المختبر", href: "/lab", icon: FlaskConical, resource: "lab", action: "VIEW" },
  { label: "السوق", href: "/market", icon: Store, resource: "market", action: "VIEW" },
  { label: "الصيانة", href: "/maintenance", icon: Wrench, resource: "maintenance", action: "VIEW" },
  { label: "الوظائف", href: "/jobs", icon: Briefcase, resource: "jobs", action: "VIEW" },
  { label: "الكونسول", href: "/console", icon: ClipboardCheck, resource: "services", action: "VIEW" },
  { label: "المستخدمون", href: "/admin/users", icon: Users, resource: "users", action: "VIEW" },
];
