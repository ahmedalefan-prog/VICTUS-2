import Link from "next/link";
import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { getService, myServiceRole, canRequest } from "@/lib/services";
import {
  MAINTENANCE_PRIORITY_META,
  MAINTENANCE_STATUS_META,
  MAINTENANCE_OPEN_STATUSES,
} from "@/lib/services-meta";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wrench, ChevronLeft } from "lucide-react";
import { MaintenanceRequestForm } from "@/components/services/maintenance-request-form";
import { AdSlot } from "@/components/ads/ad-slot";

export const metadata = { title: "خدمة الصيانة" };

function RequestRow({ r, showRequester }: { r: { id: string; requestNumber: string; deviceName: string; priority: string; status: string; createdAt: Date; requester?: { fullName: string } }; showRequester: boolean }) {
  return (
    <Link href={`/maintenance/${r.id}`}
      className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2.5 transition-colors hover:border-primary/40">
      <div>
        <span className="font-medium text-fg">{r.requestNumber}</span>
        <span className="mr-2 text-xs text-fg-muted">
          {r.deviceName}{showRequester && r.requester ? ` · ${r.requester.fullName}` : ""} · {formatDate(r.createdAt)}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Badge tone={MAINTENANCE_PRIORITY_META[r.priority]?.tone ?? "muted"}>{MAINTENANCE_PRIORITY_META[r.priority]?.label}</Badge>
        <Badge tone={MAINTENANCE_STATUS_META[r.status]?.tone ?? "muted"}>{MAINTENANCE_STATUS_META[r.status]?.label}</Badge>
        <ChevronLeft className="h-4 w-4 text-fg-faint" />
      </div>
    </Link>
  );
}

export default async function MaintenancePage() {
  const session = await requirePermission("maintenance", "VIEW");
  const service = await getService("MAINTENANCE");

  if (!service || !service.isActive || service.mode === "OFF") {
    return (
      <>
        <PageHeader title="خدمة الصيانة" />
        <Card className="py-16 text-center text-fg-muted">خدمة الصيانة غير مُفعّلة حالياً.</Card>
      </>
    );
  }

  const isAdmin = isPlatformAdmin(session);
  const isMember = isAdmin || Boolean(await myServiceRole(service.id, session.user.id));

  // ── Team / admin: the full queue (visibility isolation: requesters never reach here) ──
  if (isMember) {
    const requests = await prisma.maintenanceRequest.findMany({
      where: { serviceId: service.id },
      include: { requester: { select: { fullName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    const open = requests.filter((r) => MAINTENANCE_OPEN_STATUSES.includes(r.status));
    const closed = requests.filter((r) => !MAINTENANCE_OPEN_STATUSES.includes(r.status));

    return (
      <>
        <PageHeader title={`طابور ${service.name}`} description="جميع طلبات الصيانة الواردة.">
          <Badge tone="warning">{open.length} نشط</Badge>
        </PageHeader>

        <AdSlot placement="MAINTENANCE" />

        <Card className="mb-5">
          <h3 className="mb-3 font-semibold text-fg">الطلبات النشطة</h3>
          {open.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">لا توجد طلبات نشطة.</p>
          ) : (
            <div className="space-y-2">{open.map((r) => <RequestRow key={r.id} r={r} showRequester />)}</div>
          )}
        </Card>

        {closed.length > 0 && (
          <Card>
            <h3 className="mb-3 font-semibold text-fg">طلبات مُغلقة</h3>
            <div className="space-y-2">{closed.map((r) => <RequestRow key={r.id} r={r} showRequester />)}</div>
          </Card>
        )}
      </>
    );
  }

  // ── Requester (doctor / clinic): the request form + their own requests only ──
  if (canRequest(session, "MAINTENANCE")) {
    const [requests, devices] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where: { serviceId: service.id, requesterId: session.user.id },
        orderBy: { createdAt: "desc" },
      }),
      prisma.device.findMany({
        where: { clinic: { ownerId: session.user.id } },
        include: { clinic: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    return (
      <>
        <PageHeader title={service.name} description={service.about ?? "خدمة الصيانة الداخلية"}>
          <Badge tone="primary">خدمة رسمية</Badge>
        </PageHeader>

        <AdSlot placement="MAINTENANCE" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <MaintenanceRequestForm devices={devices.map((dv) => ({ id: dv.id, label: `${dv.name} — ${dv.clinic.name}` }))} />

          <Card>
            <h3 className="mb-3 font-semibold text-fg">طلباتي ({requests.length})</h3>
            {requests.length === 0 ? (
              <p className="py-6 text-center text-sm text-fg-muted">لا توجد طلبات بعد.</p>
            ) : (
              <div className="space-y-2">{requests.map((r) => <RequestRow key={r.id} r={r} showRequester={false} />)}</div>
            )}
          </Card>
        </div>
      </>
    );
  }

  // ── Anyone else: informational (no public catalog) ──
  return (
    <>
      <PageHeader title={service.name} description={service.about ?? "خدمة الصيانة الداخلية"} />
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <Wrench className="mb-3 h-10 w-10 text-fg-faint" />
        <p className="font-medium text-fg">خدمة صيانة داخلية</p>
        <p className="mt-1 max-w-md text-sm text-fg-muted">
          طلب الصيانة متاح للأطباء والعيادات. سجّل عبر حساب طبيب/عيادة لإرسال طلب صيانة لأجهزتك.
        </p>
      </Card>
    </>
  );
}
