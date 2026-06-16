"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { recomputePayrollRun, updatePayslip, finalizePayrollRun, deletePayrollRun } from "@/lib/hr-actions";
import { formatIQD } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export interface SlipRow {
  id: string;
  name: string;
  baseAmount: number;
  allowances: number;
  absenceDeduction: number;
  manualDeduction: number;
  netSalary: number;
  presentDays: number;
  absentDays: number;
  leaveDays: number;
}

export function PayrollRunControls({
  runId,
  status,
  slips,
  total,
}: {
  runId: string;
  status: string;
  slips: SlipRow[];
  total: number;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const draft = status === "DRAFT";

  function run(fn: () => Promise<void>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      try { await fn(); after?.(); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "تعذّر تنفيذ العملية"); }
    });
  }

  return (
    <>
      {error && <p className="mb-3 text-sm text-danger">{error}</p>}

      {draft && (
        <div className="mb-4 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" disabled={pending} onClick={() => run(() => recomputePayrollRun(runId))}>إعادة احتساب من الحضور</Button>
          <Button size="sm" disabled={pending} onClick={() => { if (confirm("اعتماد المسيّر؟ لا يمكن تعديله بعدها.")) run(() => finalizePayrollRun(runId)); }}>اعتماد المسيّر</Button>
          <Button size="sm" variant="danger" disabled={pending} onClick={() => { if (confirm("حذف المسيّر؟")) run(() => deletePayrollRun(runId), () => router.push("/hr/payroll")); }}>حذف</Button>
        </div>
      )}

      <Card className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border-soft text-right text-xs text-fg-faint">
                <th className="px-3 py-2.5 font-medium">الموظف</th>
                <th className="px-3 py-2.5 font-medium">الحضور</th>
                <th className="px-3 py-2.5 font-medium">المكتسب</th>
                <th className="px-3 py-2.5 font-medium">المخصصات</th>
                <th className="px-3 py-2.5 font-medium">خصم الغياب</th>
                <th className="px-3 py-2.5 font-medium">خصم يدوي</th>
                <th className="px-3 py-2.5 font-medium">الصافي</th>
              </tr>
            </thead>
            <tbody>
              {slips.map((s) => (
                <SlipRowView key={s.id} slip={s} draft={draft} onSave={(fd) => run(() => updatePayslip(fd))} pending={pending} />
              ))}
              <tr className="border-t border-border-soft bg-surface-2/40">
                <td className="px-3 py-2.5 font-semibold text-fg" colSpan={6}>الإجمالي</td>
                <td className="px-3 py-2.5 font-bold text-primary">{formatIQD(total)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
}

function SlipRowView({ slip, draft, onSave, pending }: { slip: SlipRow; draft: boolean; onSave: (fd: FormData) => void; pending: boolean }) {
  return (
    <tr className="border-b border-border-soft/60 last:border-0">
      <td className="px-3 py-2.5 font-medium text-fg">{slip.name}</td>
      <td className="px-3 py-2.5 text-xs text-fg-muted">{slip.presentDays}ح · {slip.absentDays}غ · {slip.leaveDays}إ</td>
      <td className="px-3 py-2.5 text-fg">{formatIQD(slip.baseAmount)}</td>
      {draft ? (
        <td className="px-3 py-2.5" colSpan={3}>
          <form action={onSave} className="flex flex-wrap items-center gap-1.5">
            <input type="hidden" name="payslipId" value={slip.id} />
            <input name="allowances" type="number" min="0" step="any" dir="ltr" defaultValue={slip.allowances} className="h-8 w-24 rounded border border-border bg-surface-2/60 px-2 text-xs" placeholder="مخصصات" />
            <span className="text-xs text-danger">−{formatIQD(slip.absenceDeduction)}</span>
            <input name="manualDeduction" type="number" min="0" step="any" dir="ltr" defaultValue={slip.manualDeduction} className="h-8 w-24 rounded border border-border bg-surface-2/60 px-2 text-xs" placeholder="خصم" />
            <Button type="submit" size="sm" variant="subtle" className="h-8 px-2 text-xs" disabled={pending}>حفظ</Button>
          </form>
        </td>
      ) : (
        <>
          <td className="px-3 py-2.5 text-fg">{formatIQD(slip.allowances)}</td>
          <td className="px-3 py-2.5 text-danger">−{formatIQD(slip.absenceDeduction)}</td>
          <td className="px-3 py-2.5 text-danger">−{formatIQD(slip.manualDeduction)}</td>
        </>
      )}
      <td className="px-3 py-2.5 font-semibold text-fg">{formatIQD(slip.netSalary)}</td>
    </tr>
  );
}
