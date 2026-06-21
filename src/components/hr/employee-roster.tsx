"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createEmployee } from "@/lib/hr-actions";
import { EMPLOYEE_STATUS_META, SALARY_TYPE_META } from "@/lib/hr";
import { formatIQD } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select, Field } from "@/components/ui/input";
import { Plus, ChevronLeft, UserRound } from "lucide-react";

export interface EmployeeRow {
  id: string;
  employeeNumber: string;
  fullName: string;
  position: string;
  serviceName: string;
  baseSalary: number;
  salaryType: string;
  status: string;
}

export function EmployeeRoster({
  employees,
  services,
}: {
  employees: EmployeeRow[];
  services: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> إضافة موظف</Button>
        </div>
        {employees.length === 0 ? (
          <EmptyState icon={<UserRound className="h-7 w-7" />} title="لا يوجد موظفون بعد" />
        ) : (
          employees.map((e) => (
            <Link key={e.id} href={`/hr/${e.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-primary/40">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-fg">{e.fullName}</p>
                    <Badge tone={EMPLOYEE_STATUS_META[e.status]?.tone ?? "muted"}>{EMPLOYEE_STATUS_META[e.status]?.label}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-fg-muted">
                    {e.employeeNumber}{e.position ? ` · ${e.position}` : ""} · {e.serviceName} · {formatIQD(e.baseSalary)} ({SALARY_TYPE_META[e.salaryType]?.label})
                  </p>
                </div>
                <ChevronLeft className="h-4 w-4 text-fg-faint" />
              </Card>
            </Link>
          ))
        )}
      </div>

      {showForm && (
        <Card className="h-fit lg:sticky lg:top-4">
          <h3 className="mb-4 font-semibold text-fg">موظف جديد</h3>
          <form
            action={(fd) =>
              startTransition(async () => {
                setError(null);
                try { const { id } = await createEmployee(fd); router.push(`/hr/${id}`); }
                catch (err) { setError(err instanceof Error ? err.message : "تعذّر الحفظ"); }
              })
            }
            className="space-y-3"
          >
            {error && <p className="text-sm text-danger">{error}</p>}
            <Field label="الخدمة">
              <Select name="serviceId" required defaultValue={services.length === 1 ? services[0].id : ""}>
                <option value="">— اختر الخدمة —</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </Select>
            </Field>
            <Field label="الاسم الكامل"><Input name="fullName" required /></Field>
            <Field label="المسمّى الوظيفي"><Input name="position" /></Field>
            <Field label="الهاتف"><Input name="phone" dir="ltr" /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Field label="الراتب (IQD)"><Input name="baseSalary" type="number" min="0" step="any" dir="ltr" defaultValue={0} /></Field>
              <Field label="نوع الراتب">
                <Select name="salaryType" defaultValue="MONTHLY">
                  {Object.entries(SALARY_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="تاريخ التعيين" hint="اختياري"><Input name="hireDate" type="date" dir="ltr" /></Field>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={pending}>{pending ? "جارٍ الحفظ…" : "حفظ"}</Button>
              <Button type="button" variant="outline" onClick={() => setShowForm(false)}>إلغاء</Button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
