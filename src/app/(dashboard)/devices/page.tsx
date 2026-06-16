import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { DeviceManager } from "@/components/clinics/device-manager";

export const metadata = { title: "الأجهزة" };

export default async function DevicesPage() {
  const session = await requirePermission("devices", "VIEW");
  const isAdmin = isPlatformAdmin(session);

  const clinicWhere = isAdmin ? {} : { ownerId: session.user.id };
  const [clinics, devices] = await Promise.all([
    prisma.clinic.findMany({ where: clinicWhere, select: { id: true, name: true }, orderBy: { name: "asc" } }),
    prisma.device.findMany({
      where: { clinic: clinicWhere },
      include: { clinic: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <>
      <PageHeader title="الأجهزة" description="أجهزة عياداتك — تُربط بطلبات الصيانة.">
        <Badge tone="primary">{devices.length} جهاز</Badge>
      </PageHeader>

      <DeviceManager
        clinics={clinics}
        devices={devices.map((d) => ({
          id: d.id,
          clinicId: d.clinicId,
          clinicName: d.clinic.name,
          name: d.name,
          brand: d.brand ?? "",
          model: d.model ?? "",
          serial: d.serial ?? "",
          warrantyEnd: d.warrantyEnd ? d.warrantyEnd.toISOString().slice(0, 10) : "",
          warrantyLabel: d.warrantyEnd ? formatDate(d.warrantyEnd) : "",
        }))}
      />
    </>
  );
}
