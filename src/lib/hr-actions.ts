"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guard";
import { recordAudit, logActivity } from "@/lib/audit";
import { assertServiceManager } from "@/lib/services";
import {
  EMPLOYEE_STATUSES,
  ATTENDANCE_STATUSES,
  LEAVE_TYPES,
  LEAVE_TYPE_META,
  LEAVE_TRANSITIONS,
  SALARY_TYPES,
  computePayslipAmounts,
  attendanceMetrics,
  dayKey,
  leaveDays,
} from "@/lib/hr";

async function nextNumber(prefix: string, count: number): Promise<string> {
  return `${prefix}-${String(count + 1).padStart(5, "0")}`;
}

async function loadEmployee(id: string) {
  const emp = await prisma.employee.findUnique({ where: { id } });
  if (!emp) throw new Error("الموظف غير موجود");
  return emp;
}

// ─────────────────────── employees ───────────────────────

const employeeSchema = z.object({
  serviceId: z.string().min(1, "اختر الخدمة"),
  fullName: z.string().min(2, "اسم الموظف مطلوب"),
  phone: z.string().max(40).optional().or(z.literal("")),
  position: z.string().max(120).optional().or(z.literal("")),
  baseSalary: z.coerce.number().min(0).default(0),
  salaryType: z.enum(SALARY_TYPES as [string, ...string[]]).default("MONTHLY"),
  hireDate: z.string().optional().or(z.literal("")),
});

export async function createEmployee(formData: FormData): Promise<{ id: string }> {
  const session = await requirePermission("hr", "CREATE");
  const parsed = employeeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  await assertServiceManager(d.serviceId, session);

  const employeeNumber = await nextNumber("EMP", await prisma.employee.count());
  const emp = await prisma.employee.create({
    data: {
      employeeNumber,
      serviceId: d.serviceId,
      fullName: d.fullName,
      phone: d.phone || null,
      position: d.position || null,
      baseSalary: d.baseSalary,
      salaryType: d.salaryType as never,
      hireDate: d.hireDate ? new Date(d.hireDate) : null,
    },
  });
  await recordAudit({ actorId: session.user.id, action: "hr.employee.create", entityType: "Employee", entityId: emp.id });
  await logActivity({ actorId: session.user.id, verb: "hr.employeeAdded", summary: `أضاف موظفاً: ${d.fullName}`, entityType: "Employee", entityId: emp.id });
  revalidatePath("/hr");
  return { id: emp.id };
}

const updateSchema = employeeSchema
  .extend({ id: z.string().min(1), status: z.enum(EMPLOYEE_STATUSES as [string, ...string[]]) })
  .omit({ serviceId: true });

export async function updateEmployee(formData: FormData): Promise<void> {
  const session = await requirePermission("hr", "EDIT");
  const parsed = updateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  const emp = await loadEmployee(d.id);
  await assertServiceManager(emp.serviceId, session);

  await prisma.employee.update({
    where: { id: d.id },
    data: {
      fullName: d.fullName, phone: d.phone || null, position: d.position || null,
      baseSalary: d.baseSalary, salaryType: d.salaryType as never,
      hireDate: d.hireDate ? new Date(d.hireDate) : null, status: d.status as never,
    },
  });
  revalidatePath(`/hr/${d.id}`);
  revalidatePath("/hr");
}

// ─────────────────────── attendance ───────────────────────

export async function checkIn(employeeId: string): Promise<void> {
  const session = await requirePermission("hr", "EDIT");
  const emp = await loadEmployee(employeeId);
  await assertServiceManager(emp.serviceId, session);
  const now = new Date();
  const date = dayKey(now);
  const { lateMinutes } = attendanceMetrics(now, null);

  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId, date } },
    update: { checkIn: now, status: "PRESENT", lateMinutes },
    create: { employeeId, date, checkIn: now, status: "PRESENT", lateMinutes },
  });
  revalidatePath(`/hr/${employeeId}`);
}

export async function checkOut(employeeId: string): Promise<void> {
  const session = await requirePermission("hr", "EDIT");
  const emp = await loadEmployee(employeeId);
  await assertServiceManager(emp.serviceId, session);
  const now = new Date();
  const date = dayKey(now);
  const existing = await prisma.attendance.findUnique({ where: { employeeId_date: { employeeId, date } } });
  if (!existing?.checkIn) throw new Error("سجّل الحضور أولاً");
  const { lateMinutes, workMinutes } = attendanceMetrics(existing.checkIn, now);

  await prisma.attendance.update({ where: { employeeId_date: { employeeId, date } }, data: { checkOut: now, lateMinutes, workMinutes } });
  revalidatePath(`/hr/${employeeId}`);
}

const manualSchema = z.object({
  employeeId: z.string().min(1),
  date: z.string().min(1, "التاريخ مطلوب"),
  status: z.enum(ATTENDANCE_STATUSES as [string, ...string[]]),
  checkIn: z.string().optional().or(z.literal("")),
  checkOut: z.string().optional().or(z.literal("")),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function saveAttendance(formData: FormData): Promise<void> {
  const session = await requirePermission("hr", "EDIT");
  const parsed = manualSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  const emp = await loadEmployee(d.employeeId);
  await assertServiceManager(emp.serviceId, session);

  const date = dayKey(new Date(d.date));
  const ci = d.checkIn ? new Date(`${d.date}T${d.checkIn}`) : null;
  const co = d.checkOut ? new Date(`${d.date}T${d.checkOut}`) : null;
  const { lateMinutes, workMinutes } = attendanceMetrics(ci, co);

  await prisma.attendance.upsert({
    where: { employeeId_date: { employeeId: d.employeeId, date } },
    update: { status: d.status as never, checkIn: ci, checkOut: co, lateMinutes, workMinutes, note: d.note || null },
    create: { employeeId: d.employeeId, date, status: d.status as never, checkIn: ci, checkOut: co, lateMinutes, workMinutes, note: d.note || null },
  });
  revalidatePath(`/hr/${d.employeeId}`);
}

// ─────────────────────── leaves ───────────────────────

const leaveSchema = z.object({
  employeeId: z.string().min(1),
  type: z.enum(LEAVE_TYPES as [string, ...string[]]).default("ANNUAL"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  reason: z.string().max(1000).optional().or(z.literal("")),
});

export async function createLeave(formData: FormData): Promise<void> {
  const session = await requirePermission("hr", "EDIT");
  const parsed = leaveSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  const emp = await loadEmployee(d.employeeId);
  await assertServiceManager(emp.serviceId, session);

  const start = new Date(d.startDate);
  const end = new Date(d.endDate);
  if (end < start) throw new Error("تاريخ النهاية يجب ألا يسبق البداية");

  const leaveNumber = await nextNumber("LEV", await prisma.leaveRequest.count());
  const leave = await prisma.leaveRequest.create({
    data: {
      leaveNumber, employeeId: d.employeeId, type: d.type as never,
      startDate: dayKey(start), endDate: dayKey(end), days: leaveDays(start, end),
      reason: d.reason || null, status: "SUBMITTED",
    },
  });
  await logActivity({ actorId: session.user.id, verb: "hr.leaveRequested", summary: `طلب إجازة (${LEAVE_TYPE_META[d.type]?.label}) للموظف ${emp.fullName}`, entityType: "LeaveRequest", entityId: leave.id });
  revalidatePath(`/hr/${d.employeeId}`);
}

// Stamps leave days as LEAVE in attendance (never overwrites a day with a real check-in).
async function stampLeaveDays(employeeId: string, start: Date, end: Date, label: string) {
  const ops = [];
  for (let t = dayKey(start).getTime(); t <= dayKey(end).getTime(); t += 86400000) {
    const date = new Date(t);
    ops.push(
      prisma.attendance.upsert({
        where: { employeeId_date: { employeeId, date } },
        update: {},
        create: { employeeId, date, status: "LEAVE", note: label },
      }),
    );
  }
  if (ops.length) await prisma.$transaction(ops);
}

// Removes the LEAVE days we created (no check-in) on cancel/reject.
async function clearLeaveDays(employeeId: string, start: Date, end: Date) {
  await prisma.attendance.deleteMany({
    where: { employeeId, status: "LEAVE", checkIn: null, date: { gte: dayKey(start), lte: dayKey(end) } },
  });
}

export async function setLeaveStatus(leaveId: string, status: string, note?: string): Promise<void> {
  const session = await requirePermission("hr", "EDIT");
  const leave = await prisma.leaveRequest.findUnique({ where: { id: leaveId }, include: { employee: { select: { serviceId: true, fullName: true } } } });
  if (!leave) throw new Error("الطلب غير موجود");
  await assertServiceManager(leave.employee.serviceId, session);
  if (!(LEAVE_TRANSITIONS[leave.status] ?? []).includes(status)) throw new Error("انتقال حالة غير صالح");

  await prisma.leaveRequest.update({
    where: { id: leaveId },
    data: { status: status as never, reviewedById: session.user.id, reviewedAt: new Date(), reviewNote: note || null },
  });

  if (status === "APPROVED") {
    await stampLeaveDays(leave.employeeId, leave.startDate, leave.endDate, `إجازة ${LEAVE_TYPE_META[leave.type]?.label ?? ""}`.trim());
  } else if (status === "CANCELLED" && leave.status === "APPROVED") {
    await clearLeaveDays(leave.employeeId, leave.startDate, leave.endDate);
  }

  await recordAudit({ actorId: session.user.id, action: `hr.leave.${status.toLowerCase()}`, entityType: "LeaveRequest", entityId: leaveId });
  revalidatePath(`/hr/${leave.employeeId}`);
}

// ─────────────────────── payroll ───────────────────────

async function monthAttendance(employeeId: string, year: number, month: number) {
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 1));
  const rows = await prisma.attendance.findMany({ where: { employeeId, date: { gte: start, lt: end } }, select: { status: true } });
  return {
    presentDays: rows.filter((r) => r.status === "PRESENT").length,
    absentDays: rows.filter((r) => r.status === "ABSENT").length,
    leaveDays: rows.filter((r) => r.status === "LEAVE").length,
  };
}

const runSchema = z.object({
  serviceId: z.string().min(1, "اختر الخدمة"),
  year: z.coerce.number().int().min(2020).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

export async function createPayrollRun(formData: FormData): Promise<{ id: string }> {
  const session = await requirePermission("hr", "CREATE");
  const parsed = runSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  await assertServiceManager(d.serviceId, session);

  const exists = await prisma.payrollRun.findUnique({ where: { serviceId_year_month: { serviceId: d.serviceId, year: d.year, month: d.month } } });
  if (exists) throw new Error("يوجد مسيّر رواتب لهذا الشهر بالفعل");

  const employees = await prisma.employee.findMany({ where: { serviceId: d.serviceId, status: "ACTIVE" }, select: { id: true, baseSalary: true, salaryType: true } });
  if (employees.length === 0) throw new Error("لا موظفون نشطون لإصدار رواتبهم");

  const slips = await Promise.all(employees.map(async (e) => {
    const att = await monthAttendance(e.id, d.year, d.month);
    const { baseAmount, absenceDeduction } = computePayslipAmounts(e.salaryType, Number(e.baseSalary), att.presentDays, att.absentDays);
    return {
      employeeId: e.id, baseAmount, allowances: 0, absenceDeduction, manualDeduction: 0,
      netSalary: baseAmount - absenceDeduction,
      presentDays: att.presentDays, absentDays: att.absentDays, leaveDays: att.leaveDays,
    };
  }));

  const payrollNumber = await nextNumber("PAY", await prisma.payrollRun.count());
  const run = await prisma.payrollRun.create({
    data: { payrollNumber, serviceId: d.serviceId, year: d.year, month: d.month, createdById: session.user.id, payslips: { create: slips } },
  });
  await recordAudit({ actorId: session.user.id, action: "hr.payroll.create", entityType: "PayrollRun", entityId: run.id, metadata: { year: d.year, month: d.month, count: slips.length } });
  await logActivity({ actorId: session.user.id, verb: "hr.payrollCreated", summary: `أصدر مسيّر رواتب (${d.month}/${d.year}) — ${slips.length} موظف`, entityType: "PayrollRun", entityId: run.id });
  revalidatePath("/hr/payroll");
  return { id: run.id };
}

async function loadRun(id: string) {
  const run = await prisma.payrollRun.findUnique({ where: { id } });
  if (!run) throw new Error("المسيّر غير موجود");
  return run;
}

export async function recomputePayrollRun(runId: string): Promise<void> {
  const session = await requirePermission("hr", "EDIT");
  const run = await loadRun(runId);
  await assertServiceManager(run.serviceId, session);
  if (run.status !== "DRAFT") throw new Error("لا يمكن تعديل مسيّر معتمد");

  const slips = await prisma.payslip.findMany({ where: { payrollRunId: runId }, include: { employee: { select: { baseSalary: true, salaryType: true } } } });
  for (const s of slips) {
    const att = await monthAttendance(s.employeeId, run.year, run.month);
    const { baseAmount, absenceDeduction } = computePayslipAmounts(s.employee.salaryType, Number(s.employee.baseSalary), att.presentDays, att.absentDays);
    const net = baseAmount + Number(s.allowances) - absenceDeduction - Number(s.manualDeduction);
    await prisma.payslip.update({
      where: { id: s.id },
      data: { baseAmount, absenceDeduction, netSalary: net, presentDays: att.presentDays, absentDays: att.absentDays, leaveDays: att.leaveDays },
    });
  }
  revalidatePath(`/hr/payroll/${runId}`);
}

const payslipSchema = z.object({
  payslipId: z.string().min(1),
  allowances: z.coerce.number().min(0).default(0),
  manualDeduction: z.coerce.number().min(0).default(0),
  note: z.string().max(500).optional().or(z.literal("")),
});

export async function updatePayslip(formData: FormData): Promise<void> {
  const session = await requirePermission("hr", "EDIT");
  const parsed = payslipSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;
  const slip = await prisma.payslip.findUnique({ where: { id: d.payslipId }, include: { payrollRun: { select: { serviceId: true, status: true, id: true } } } });
  if (!slip) throw new Error("الكشف غير موجود");
  await assertServiceManager(slip.payrollRun.serviceId, session);
  if (slip.payrollRun.status !== "DRAFT") throw new Error("لا يمكن تعديل مسيّر معتمد");

  const net = Number(slip.baseAmount) + d.allowances - Number(slip.absenceDeduction) - d.manualDeduction;
  await prisma.payslip.update({ where: { id: d.payslipId }, data: { allowances: d.allowances, manualDeduction: d.manualDeduction, netSalary: net, note: d.note || null } });
  revalidatePath(`/hr/payroll/${slip.payrollRun.id}`);
}

export async function finalizePayrollRun(runId: string): Promise<void> {
  const session = await requirePermission("hr", "MANAGE");
  const run = await loadRun(runId);
  await assertServiceManager(run.serviceId, session);
  if (run.status !== "DRAFT") throw new Error("المسيّر معتمد بالفعل");
  await prisma.payrollRun.update({ where: { id: runId }, data: { status: "FINALIZED" } });
  await recordAudit({ actorId: session.user.id, action: "hr.payroll.finalize", entityType: "PayrollRun", entityId: runId });
  revalidatePath(`/hr/payroll/${runId}`);
  revalidatePath("/hr/payroll");
}

export async function deletePayrollRun(runId: string): Promise<void> {
  const session = await requirePermission("hr", "DELETE");
  const run = await loadRun(runId);
  await assertServiceManager(run.serviceId, session);
  if (run.status !== "DRAFT") throw new Error("لا يمكن حذف مسيّر معتمد");
  await prisma.payrollRun.delete({ where: { id: runId } });
  revalidatePath("/hr/payroll");
}
