import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { myManagedServices } from "@/lib/services";
import { PAYROLL_STATUS_META, formatPayrollPeriod } from "@/lib/hr";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ChevronRight, ChevronLeft, Coins } from "lucide-react";
import { PayrollCreate } from "@/components/hr/payroll-create";

export const metadata = { title: "الرواتب" };

export default async function PayrollPage() {
  const session = await requirePermission("hr", "VIEW");
  const services = await myManagedServices(session);

  if (services.length === 0) {
    return (
      <>
        <PageHeader title="الرواتب" />
        <Card className="py-16 text-center text-fg-muted">إدارة الرواتب متاحة لمديري الخدمات فقط.</Card>
      </>
    );
  }

  const serviceIds = services.map((s) => s.id);
  const serviceNames = new Map(services.map((s) => [s.id, s.name]));
  const runs = await prisma.payrollRun.findMany({
    where: { serviceId: { in: serviceIds } },
    orderBy: [{ year: "desc" }, { month: "desc" }],
    include: { _count: { select: { payslips: true } } },
  });

  return (
    <>
      <Link href="/hr" className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronRight className="h-4 w-4" /> العودة للموارد البشرية
      </Link>
      <PageHeader title="مسيّرات الرواتب" description="إصدار رواتب شهرية لفِرَق خدماتك.">
        <Badge tone="primary">{runs.length} مسيّر</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-2">
          {runs.length === 0 ? (
            <EmptyState icon={<Coins className="h-7 w-7" />} title="لا توجد مسيّرات رواتب بعد" />
          ) : (
            runs.map((r) => (
              <Link key={r.id} href={`/hr/payroll/${r.id}`}>
                <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-primary/40">
                  <div>
                    <p className="font-semibold text-fg">{formatPayrollPeriod(r.year, r.month)}</p>
                    <p className="mt-1 text-xs text-fg-muted">{r.payrollNumber} · {serviceNames.get(r.serviceId)} · {r._count.payslips} كشف</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={PAYROLL_STATUS_META[r.status]?.tone ?? "muted"}>{PAYROLL_STATUS_META[r.status]?.label}</Badge>
                    <ChevronLeft className="h-4 w-4 text-fg-faint" />
                  </div>
                </Card>
              </Link>
            ))
          )}
        </div>

        <PayrollCreate services={services.map((s) => ({ id: s.id, name: s.name }))} />
      </div>
    </>
  );
}
