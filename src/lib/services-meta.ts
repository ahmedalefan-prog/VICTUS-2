// Client-safe service metadata (no prisma / server imports). Shared by both
// client components and the server-only services.ts (which re-exports these).

import type { Badge } from "@/components/ui/badge";

type Tone = NonNullable<Parameters<typeof Badge>[0]["tone"]>;

export const SERVICE_TYPE_META: Record<string, { label: string; resource: string }> = {
  LAB: { label: "المختبر", resource: "lab" },
  MARKET: { label: "السوق", resource: "market" },
  MAINTENANCE: { label: "الصيانة", resource: "maintenance" },
};

export const SERVICE_ROLE_META: Record<string, { label: string; tone: Tone }> = {
  MANAGER: { label: "مدير", tone: "primary" },
  MEMBER: { label: "عضو", tone: "muted" },
};

export const ORDER_TIER_META: Record<string, { label: string; tone: Tone }> = {
  NORMAL: { label: "عادي", tone: "muted" },
  VIP: { label: "VIP", tone: "primary" },
};

export const CONDITION_META: Record<string, { label: string; tone: Tone }> = {
  NEW: { label: "جديد", tone: "success" },
  USED: { label: "مستعمل", tone: "muted" },
  REFURBISHED: { label: "مجدّد", tone: "info" },
};

export const NEGOTIATION_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  PROPOSED: { label: "عرض مقترح", tone: "warning" },
  COUNTERED: { label: "عرض مضاد", tone: "info" },
  AGREED: { label: "مُتّفق عليه", tone: "success" },
  CANCELLED: { label: "ملغى", tone: "danger" },
};

export const FULFILLMENT_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  NEW: { label: "جديد", tone: "info" },
  RECEIVED: { label: "استلمته الخدمة", tone: "info" },
  IN_PROGRESS: { label: "قيد التنفيذ", tone: "warning" },
  READY: { label: "جاهز", tone: "primary" },
  COMPLETED: { label: "مكتمل", tone: "success" },
  CANCELLED: { label: "ملغى", tone: "danger" },
};

export const FULFILLMENT_TRANSITIONS: Record<string, string[]> = {
  NEW: ["RECEIVED", "CANCELLED"],
  RECEIVED: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["READY", "CANCELLED"],
  READY: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export const TX_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  PENDING: { label: "قيد التفاوض", tone: "warning" },
  AGREED: { label: "مُتّفق", tone: "info" },
  COMPLETED: { label: "مكتمل", tone: "success" },
  CANCELLED: { label: "ملغى", tone: "muted" },
};

export const NEGOTIATION_ACTION_LABEL: Record<string, string> = {
  PROPOSE: "اقترح",
  COUNTER: "عرض مضاد",
  ACCEPT: "قبول",
  REJECT: "رفض",
  CANCEL: "إلغاء",
};

// ─────────────────────── maintenance ───────────────────────

export const MAINTENANCE_PRIORITY_META: Record<string, { label: string; tone: Tone }> = {
  LOW: { label: "منخفضة", tone: "muted" },
  MEDIUM: { label: "متوسطة", tone: "info" },
  HIGH: { label: "عالية", tone: "warning" },
  URGENT: { label: "طارئة", tone: "danger" },
};

export const MAINTENANCE_PRIORITIES = Object.keys(MAINTENANCE_PRIORITY_META);

export const MAINTENANCE_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  NEW: { label: "جديد", tone: "info" },
  ASSIGNED: { label: "تم الإسناد", tone: "primary" },
  IN_PROGRESS: { label: "قيد التنفيذ", tone: "warning" },
  AWAITING_CLOSURE: { label: "بانتظار الإغلاق", tone: "warning" },
  COMPLETED: { label: "مكتمل", tone: "success" },
  CANCELLED: { label: "ملغى", tone: "danger" },
};

// An open request is anything not yet completed or cancelled.
export const MAINTENANCE_OPEN_STATUSES = ["NEW", "ASSIGNED", "IN_PROGRESS", "AWAITING_CLOSURE"];

export function serviceLabelFor(items: { name: string }[]): string {
  if (items.length === 0) return "طلب";
  return items.length === 1 ? items[0].name : `${items[0].name} (+${items.length - 1})`;
}

export function uniformTier(items: { tier: string }[]): "NORMAL" | "VIP" | null {
  const tiers = new Set(items.map((i) => i.tier));
  return tiers.size === 1 ? (items[0].tier as "NORMAL" | "VIP") : null;
}
