import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { myManagedServices } from "@/lib/services";
import { EMPLOYEE_STATUS_META, ATTENDANCE_STATUS_META, formatMinutes } from "@/lib/hr";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { EmployeeEditForm, AttendanceControls, LeaveControls } from "@/components/hr/employee-controls";

export const metadata = { title: "ملف الموظف" };

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("hr", "VIEW");

  const emp = await prisma.employee.findUnique({
    where: { id },
    include: {
      service: { select: { name: true } },
      attendance: { orderBy: { date: "desc" }, take: 14 },
      leaveRequests: { orderBy: { createdAt: "desc" }, take: 12 },
    },
  });
  if (!emp) notFound();

  const managed = new Set((await myManagedServices(session)).map((s) => s.id));
  if (!managed.has(emp.serviceId)) notFound();

  return (
    <>
      <Link href="/hr" className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronRight className="h-4 w-4" /> العودة للموظفين
      </Link>

      <PageHeader title={emp.fullName} description={`${emp.employeeNumber} · ${emp.service.name}`}>
        <Badge tone={EMPLOYEE_STATUS_META[emp.status]?.tone ?? "muted"}>{EMPLOYEE_STATUS_META[emp.status]?.label}</Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <h3 className="mb-3 font-semibold text-fg">سجلّ الحضور الأخير</h3>
            {emp.attendance.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-muted">لا يوجد سجل حضور.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-fg-faint">
                    <tr className="border-b border-border-soft text-right">
                      <th className="pb-2 font-medium">اليوم</th>
                      <th className="pb-2 font-medium">الحالة</th>
                      <th className="pb-2 font-medium">دخول</th>
                      <th className="pb-2 font-medium">خروج</th>
                      <th className="pb-2 font-medium">تأخير</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emp.attendance.map((a) => (
                      <tr key={a.id} className="border-b border-border-soft/50">
                        <td className="py-2 text-fg">{formatDate(a.date)}</td>
                        <td className="py-2"><Badge tone={ATTENDANCE_STATUS_META[a.status]?.tone ?? "muted"}>{ATTENDANCE_STATUS_META[a.status]?.label}</Badge></td>
                        <td className="py-2 text-fg-muted" dir="ltr">{a.checkIn ? a.checkIn.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="py-2 text-fg-muted" dir="ltr">{a.checkOut ? a.checkOut.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}</td>
                        <td className="py-2 text-fg-muted">{a.lateMinutes > 0 ? formatMinutes(a.lateMinutes) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <LeaveControls
            employeeId={emp.id}
            leaves={emp.leaveRequests.map((l) => ({
              id: l.id,
              leaveNumber: l.leaveNumber,
              type: l.type,
              period: `${formatDate(l.startDate)} ← ${formatDate(l.endDate)}`,
              days: l.days,
              reason: l.reason ?? "",
              status: l.status,
            }))}
          />
        </div>

        <div className="space-y-5">
          <EmployeeEditForm
            employee={{
              id: emp.id,
              fullName: emp.fullName,
              phone: emp.phone ?? "",
              position: emp.position ?? "",
              baseSalary: Number(emp.baseSalary),
              salaryType: emp.salaryType,
              hireDate: emp.hireDate ? emp.hireDate.toISOString().slice(0, 10) : "",
              status: emp.status,
            }}
          />
          <AttendanceControls employeeId={emp.id} />
        </div>
      </div>
    </>
  );
}
