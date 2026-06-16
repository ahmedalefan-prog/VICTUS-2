"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateEmployee, checkIn, checkOut, saveAttendance, createLeave, setLeaveStatus } from "@/lib/hr-actions";
import { EMPLOYEE_STATUS_META, SALARY_TYPE_META, LEAVE_TYPE_META, LEAVE_STATUS_META, LEAVE_TRANSITIONS, ATTENDANCE_STATUS_META } from "@/lib/hr";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { LogIn, LogOut } from "lucide-react";

function useRun() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try { await fn(); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "تعذّر تنفيذ العملية"); }
    });
  }
  return { pending, error, run };
}

export interface EmployeeData {
  id: string; fullName: string; phone: string; position: string;
  baseSalary: number; salaryType: string; hireDate: string; status: string;
}

export function EmployeeEditForm({ employee }: { employee: EmployeeData }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  return (
    <Card>
      <h3 className="mb-3 font-semibold text-fg">بيانات الموظف</h3>
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null); setSaved(false);
            try { await updateEmployee(fd); setSaved(true); router.refresh(); }
            catch (e) { setError(e instanceof Error ? e.message : "تعذّر الحفظ"); }
          })
        }
        className="space-y-3"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && <p className="text-sm text-success">تم الحفظ.</p>}
        <input type="hidden" name="id" value={employee.id} />
        <Field label="الاسم"><Input name="fullName" required defaultValue={employee.fullName} /></Field>
        <Field label="المسمّى"><Input name="position" defaultValue={employee.position} /></Field>
        <Field label="الهاتف"><Input name="phone" dir="ltr" defaultValue={employee.phone} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="الراتب (IQD)"><Input name="baseSalary" type="number" min="0" step="any" dir="ltr" defaultValue={employee.baseSalary} /></Field>
          <Field label="نوع الراتب">
            <Select name="salaryType" defaultValue={employee.salaryType}>
              {Object.entries(SALARY_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="تاريخ التعيين"><Input name="hireDate" type="date" dir="ltr" defaultValue={employee.hireDate} /></Field>
          <Field label="الحالة">
            <Select name="status" defaultValue={employee.status}>
              {Object.entries(EMPLOYEE_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </Field>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "جارٍ الحفظ…" : "حفظ"}</Button>
      </form>
    </Card>
  );
}

export function AttendanceControls({ employeeId }: { employeeId: string }) {
  const { pending, error, run } = useRun();
  return (
    <Card>
      <h3 className="mb-3 font-semibold text-fg">تسجيل الحضور</h3>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <div className="mb-4 flex gap-2">
        <Button className="flex-1" disabled={pending} onClick={() => run(() => checkIn(employeeId))}><LogIn className="h-4 w-4" /> حضور</Button>
        <Button variant="outline" className="flex-1" disabled={pending} onClick={() => run(() => checkOut(employeeId))}><LogOut className="h-4 w-4" /> انصراف</Button>
      </div>
      <details>
        <summary className="cursor-pointer text-xs text-fg-muted">إدخال يدوي ليوم</summary>
        <ManualAttendanceForm employeeId={employeeId} />
      </details>
    </Card>
  );
}

function ManualAttendanceForm({ employeeId }: { employeeId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setError(null);
          try { await saveAttendance(fd); router.refresh(); }
          catch (e) { setError(e instanceof Error ? e.message : "تعذّر الحفظ"); }
        })
      }
      className="mt-2 space-y-2"
    >
      {error && <p className="text-sm text-danger">{error}</p>}
      <input type="hidden" name="employeeId" value={employeeId} />
      <Field label="التاريخ"><Input name="date" type="date" required dir="ltr" /></Field>
      <Field label="الحالة">
        <Select name="status" defaultValue="PRESENT">
          {Object.entries(ATTENDANCE_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="دخول"><Input name="checkIn" type="time" dir="ltr" /></Field>
        <Field label="خروج"><Input name="checkOut" type="time" dir="ltr" /></Field>
      </div>
      <Field label="ملاحظة"><Input name="note" /></Field>
      <Button type="submit" variant="subtle" className="w-full" disabled={pending}>حفظ اليوم</Button>
    </form>
  );
}

interface LeaveItem { id: string; leaveNumber: string; type: string; period: string; days: number; reason: string; status: string; }

export function LeaveControls({ employeeId, leaves }: { employeeId: string; leaves: LeaveItem[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const { pending: pAct, error: eAct, run } = useRun();

  return (
    <Card>
      <h3 className="mb-3 font-semibold text-fg">الإجازات</h3>
      {(error || eAct) && <p className="mb-2 text-sm text-danger">{error || eAct}</p>}

      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            try { await createLeave(fd); router.refresh(); }
            catch (e) { setError(e instanceof Error ? e.message : "تعذّر الطلب"); }
          })
        }
        className="mb-4 space-y-2 rounded-lg border border-border-soft bg-surface-2/30 p-3"
      >
        <input type="hidden" name="employeeId" value={employeeId} />
        <div className="grid grid-cols-2 gap-2">
          <Field label="النوع">
            <Select name="type" defaultValue="ANNUAL">
              {Object.entries(LEAVE_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </Field>
          <Field label="السبب"><Input name="reason" /></Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="من"><Input name="startDate" type="date" required dir="ltr" /></Field>
          <Field label="إلى"><Input name="endDate" type="date" required dir="ltr" /></Field>
        </div>
        <Button type="submit" variant="subtle" className="w-full" disabled={pending}>طلب إجازة</Button>
      </form>

      {leaves.length === 0 ? (
        <p className="py-2 text-center text-sm text-fg-muted">لا توجد إجازات.</p>
      ) : (
        <ul className="space-y-2">
          {leaves.map((l) => {
            const nexts = LEAVE_TRANSITIONS[l.status] ?? [];
            return (
              <li key={l.id} className="rounded-lg border border-border-soft bg-surface-2/40 p-2.5 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-fg">{LEAVE_TYPE_META[l.type]?.label} · {l.days} يوم</span>
                  <Badge tone={LEAVE_STATUS_META[l.status]?.tone ?? "muted"}>{LEAVE_STATUS_META[l.status]?.label}</Badge>
                </div>
                <p className="mt-0.5 text-xs text-fg-faint">{l.leaveNumber} · {l.period}{l.reason ? ` · ${l.reason}` : ""}</p>
                {nexts.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {nexts.map((s) => (
                      <Button key={s} size="sm" variant={s === "APPROVED" ? "primary" : "outline"} className="h-7 px-2 text-xs" disabled={pAct}
                        onClick={() => run(() => setLeaveStatus(l.id, s))}>
                        {LEAVE_STATUS_META[s]?.label}
                      </Button>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
