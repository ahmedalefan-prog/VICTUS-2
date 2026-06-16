import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { ClinicManager } from "@/components/clinics/clinic-manager";

export const metadata = { title: "العيادات" };

export default async function ClinicsPage() {
  const session = await requirePermission("clinics", "VIEW");
  const isAdmin = isPlatformAdmin(session);

  const [clinics, governorates] = await Promise.all([
    prisma.clinic.findMany({
      where: isAdmin ? {} : { ownerId: session.user.id },
      include: {
        governorate: { select: { nameAr: true } },
        owner: { select: { fullName: true } },
        _count: { select: { devices: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.governorate.findMany({ select: { id: true, nameAr: true }, orderBy: { nameAr: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="العيادات" description="عياداتك ككيان طالب خدمة (مرتبطة بأجهزتها وطلبات الصيانة).">
        <Badge tone="primary">{clinics.length} عيادة</Badge>
      </PageHeader>

      <ClinicManager
        showOwner={isAdmin}
        governorates={governorates}
        clinics={clinics.map((c) => ({
          id: c.id,
          name: c.name,
          phone: c.phone ?? "",
          address: c.address ?? "",
          governorateId: c.governorateId ?? "",
          governorateName: c.governorate?.nameAr ?? "",
          deviceCount: c._count.devices,
          ownerName: c.owner.fullName,
        }))}
      />
    </>
  );
}
