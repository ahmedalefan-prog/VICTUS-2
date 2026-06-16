// Client-safe jobs metadata (no prisma/server imports).
import type { Badge } from "@/components/ui/badge";

type Tone = NonNullable<Parameters<typeof Badge>[0]["tone"]>;

export const JOB_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "مسودة", tone: "muted" },
  OPEN: { label: "منشورة", tone: "success" },
  CLOSED: { label: "مغلقة", tone: "warning" },
};
export const JOB_STATUSES = Object.keys(JOB_STATUS_META);

export const EMPLOYMENT_TYPE_META: Record<string, { label: string }> = {
  FULL_TIME: { label: "دوام كامل" },
  PART_TIME: { label: "دوام جزئي" },
  CONTRACT: { label: "عقد" },
  TEMPORARY: { label: "مؤقت" },
  INTERNSHIP: { label: "تدريب" },
};
export const EMPLOYMENT_TYPES = Object.keys(EMPLOYMENT_TYPE_META);

export const APPLICATION_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  SUBMITTED: { label: "تم التقديم", tone: "info" },
  SCREENING: { label: "الفرز", tone: "primary" },
  INTERVIEW: { label: "مقابلة", tone: "warning" },
  ACCEPTED: { label: "مقبول", tone: "success" },
  REJECTED: { label: "مرفوض", tone: "danger" },
};
export const APPLICATION_STATUSES = Object.keys(APPLICATION_STATUS_META);

// Allowed forward transitions in the recruiter pipeline.
export const APPLICATION_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["SCREENING", "INTERVIEW", "REJECTED"],
  SCREENING: ["INTERVIEW", "REJECTED"],
  INTERVIEW: ["ACCEPTED", "REJECTED"],
  ACCEPTED: [],
  REJECTED: [],
};

export function nextApplicationStatuses(current: string): string[] {
  return APPLICATION_TRANSITIONS[current] ?? [];
}
