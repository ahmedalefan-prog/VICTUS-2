import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { myManagedServices } from "@/lib/services";
import { PAYROLL_STATUS_META, formatPayrollPeriod } from "@/lib/hr";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { PayrollRunControls } from "@/components/hr/payroll-run-controls";

export const metadata = { title: "مسيّر الرواتب" };

export default async function PayrollRunPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("hr", "VIEW");

  const run = await prisma.payrollRun.findUnique({
    where: { id },
    include: {
      service: { select: { name: true } },
      payslips: { include: { employee: { select: { fullName: true } } }, orderBy: { employee: { fullName: "asc" } } },
    },
  });
  if (!run) notFound();

  const managed = new Set((await myManagedServices(session)).map((s) => s.id));
  if (!managed.has(run.serviceId)) notFound();

  const total = run.payslips.reduce((s, p) => s + Number(p.netSalary), 0);

  return (
    <>
      <Link href="/hr/payroll" className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronRight className="h-4 w-4" /> العودة للرواتب
      </Link>
      <PageHeader title={`رواتب ${formatPayrollPeriod(run.year, run.month)}`} description={`${run.payrollNumber} · ${run.service.name}`}>
        <Badge tone={PAYROLL_STATUS_META[run.status]?.tone ?? "muted"}>{PAYROLL_STATUS_META[run.status]?.label}</Badge>
      </PageHeader>

      <PayrollRunControls
        runId={run.id}
        status={run.status}
        total={total}
        slips={run.payslips.map((p) => ({
          id: p.id,
          name: p.employee.fullName,
          baseAmount: Number(p.baseAmount),
          allowances: Number(p.allowances),
          absenceDeduction: Number(p.absenceDeduction),
          manualDeduction: Number(p.manualDeduction),
          netSalary: Number(p.netSalary),
          presentDays: p.presentDays,
          absentDays: p.absentDays,
          leaveDays: p.leaveDays,
        }))}
      />
    </>
  );
}
