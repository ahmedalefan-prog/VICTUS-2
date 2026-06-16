import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { myManagedServices } from "@/lib/services";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import { EmployeeRoster } from "@/components/hr/employee-roster";

export const metadata = { title: "الموارد البشرية" };

export default async function HrPage() {
  const session = await requirePermission("hr", "VIEW");
  const services = await myManagedServices(session);

  if (services.length === 0) {
    return (
      <>
        <PageHeader title="الموارد البشرية" />
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="mb-3 h-10 w-10 text-fg-faint" />
          <p className="font-medium text-fg">لست مديراً لأي فريق خدمة</p>
          <p className="mt-1 text-sm text-fg-muted">إدارة الموظفين متاحة لمديري الخدمات فقط.</p>
        </Card>
      </>
    );
  }

  const serviceIds = services.map((s) => s.id);
  const serviceNames = new Map(services.map((s) => [s.id, s.name]));
  const employees = await prisma.employee.findMany({
    where: { serviceId: { in: serviceIds } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return (
    <>
      <PageHeader title="الموارد البشرية" description="موظفو فِرَق خدماتك — الحضور والإجازات والرواتب.">
        <div className="flex items-center gap-2">
          <Badge tone="primary">{employees.length} موظف</Badge>
          <Link href="/hr/payroll" className="text-sm font-medium text-primary hover:underline">الرواتب ←</Link>
        </div>
      </PageHeader>

      <EmployeeRoster
        services={services.map((s) => ({ id: s.id, name: s.name }))}
        employees={employees.map((e) => ({
          id: e.id,
          employeeNumber: e.employeeNumber,
          fullName: e.fullName,
          position: e.position ?? "",
          serviceName: serviceNames.get(e.serviceId) ?? "",
          baseSalary: Number(e.baseSalary),
          salaryType: e.salaryType,
          status: e.status,
        }))}
      />
    </>
  );
}
