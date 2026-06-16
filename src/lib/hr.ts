// Client-safe HR metadata + pure compute helpers (no prisma/server imports).
import type { Badge } from "@/components/ui/badge";

type Tone = NonNullable<Parameters<typeof Badge>[0]["tone"]>;

export const EMPLOYEE_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  ACTIVE: { label: "على رأس العمل", tone: "success" },
  VACATION: { label: "في إجازة", tone: "info" },
  SUSPENDED: { label: "موقوف", tone: "warning" },
  RESIGNED: { label: "مستقيل", tone: "muted" },
  TERMINATED: { label: "منتهية خدمته", tone: "danger" },
};
export const EMPLOYEE_STATUSES = Object.keys(EMPLOYEE_STATUS_META);

export const LEAVE_TYPE_META: Record<string, { label: string }> = {
  ANNUAL: { label: "سنوية" },
  SICK: { label: "مرضية" },
  EMERGENCY: { label: "طارئة" },
  UNPAID: { label: "بدون راتب" },
};
export const LEAVE_TYPES = Object.keys(LEAVE_TYPE_META);

export const LEAVE_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "مسودة", tone: "muted" },
  SUBMITTED: { label: "بانتظار الموافقة", tone: "warning" },
  APPROVED: { label: "موافق عليها", tone: "success" },
  REJECTED: { label: "مرفوضة", tone: "danger" },
  CANCELLED: { label: "ملغاة", tone: "muted" },
};
export const LEAVE_STATUSES = Object.keys(LEAVE_STATUS_META);

export const LEAVE_TRANSITIONS: Record<string, string[]> = {
  DRAFT: ["SUBMITTED", "CANCELLED"],
  SUBMITTED: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["CANCELLED"],
  REJECTED: [],
  CANCELLED: [],
};

export const SALARY_TYPE_META: Record<string, { label: string }> = {
  MONTHLY: { label: "شهري" },
  DAILY: { label: "يومي" },
};
export const SALARY_TYPES = Object.keys(SALARY_TYPE_META);

export const PAYROLL_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  DRAFT: { label: "مسودة", tone: "warning" },
  FINALIZED: { label: "معتمد", tone: "success" },
};

export const ATTENDANCE_STATUS_META: Record<string, { label: string; tone: Tone }> = {
  PRESENT: { label: "حاضر", tone: "success" },
  ABSENT: { label: "غائب", tone: "danger" },
  LEAVE: { label: "إجازة", tone: "info" },
  HOLIDAY: { label: "عطلة", tone: "muted" },
};
export const ATTENDANCE_STATUSES = Object.keys(ATTENDANCE_STATUS_META);

// Standard month length for daily-rate computation in a monthly salary.
export const MONTHLY_DAYS = 30;
// Default workday start for late computation (minutes since midnight).
export const WORKDAY_START_MIN = 9 * 60; // 09:00

export const MONTH_NAMES_AR = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function formatPayrollPeriod(year: number, month: number): string {
  return `${MONTH_NAMES_AR[month - 1] ?? month} ${year}`;
}

// Earned salary + absence deduction from salary type and present/absent days.
// MONTHLY: earned = full salary; absence deduction = (salary / 30) × absent days.
// DAILY: earned = daily rate × present days; no absence deduction.
export function computePayslipAmounts(
  salaryType: string,
  baseSalary: number,
  presentDays: number,
  absentDays: number,
): { baseAmount: number; absenceDeduction: number } {
  if (salaryType === "DAILY") {
    return { baseAmount: Math.round(baseSalary * presentDays), absenceDeduction: 0 };
  }
  const perDay = baseSalary / MONTHLY_DAYS;
  return { baseAmount: baseSalary, absenceDeduction: Math.round(perDay * absentDays) };
}

// Inclusive leave-day count.
export function leaveDays(start: Date, end: Date): number {
  const a = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const b = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  return Math.max(1, Math.floor((b - a) / 86400000) + 1);
}

// Midnight (UTC) of a date — the daily attendance key, ignoring time/zone.
export function dayKey(d: Date): Date {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

// Late minutes + worked minutes from check-in/out.
export function attendanceMetrics(checkIn: Date | null, checkOut: Date | null): { lateMinutes: number; workMinutes: number } {
  let lateMinutes = 0;
  let workMinutes = 0;
  if (checkIn) {
    const minuteOfDay = checkIn.getHours() * 60 + checkIn.getMinutes();
    lateMinutes = Math.max(0, minuteOfDay - WORKDAY_START_MIN);
  }
  if (checkIn && checkOut && checkOut > checkIn) {
    workMinutes = Math.round((checkOut.getTime() - checkIn.getTime()) / 60000);
  }
  return { lateMinutes, workMinutes };
}

export function formatMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (h && r) return `${h} س ${r} د`;
  if (h) return `${h} س`;
  return `${r} د`;
}
