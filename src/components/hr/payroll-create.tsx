"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createPayrollRun } from "@/lib/hr-actions";
import { MONTH_NAMES_AR } from "@/lib/hr";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, Field } from "@/components/ui/input";

export function PayrollCreate({ services }: { services: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const now = new Date();

  return (
    <Card className="h-fit">
      <h3 className="mb-4 font-semibold text-fg">مسيّر رواتب جديد</h3>
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            try { const { id } = await createPayrollRun(fd); router.push(`/hr/payroll/${id}`); }
            catch (e) { setError(e instanceof Error ? e.message : "تعذّر الإصدار"); }
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <Field label="الشهر">
            <Select name="month" defaultValue={String(now.getMonth() + 1)}>
              {MONTH_NAMES_AR.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </Select>
          </Field>
          <Field label="السنة">
            <Select name="year" defaultValue={String(now.getFullYear())}>
              {[now.getFullYear(), now.getFullYear() - 1].map((y) => <option key={y} value={y}>{y}</option>)}
            </Select>
          </Field>
        </div>
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "جارٍ الإصدار…" : "إصدار المسيّر"}</Button>
        <p className="text-[11px] text-fg-faint">يُولّد كشوف الرواتب للموظفين النشطين بحسب حضورهم في الشهر.</p>
      </form>
    </Card>
  );
}
