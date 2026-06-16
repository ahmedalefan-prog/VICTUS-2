import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { myServiceRole, getService, getMaintenanceTeam } from "@/lib/services";
import { MAINTENANCE_PRIORITY_META, MAINTENANCE_STATUS_META } from "@/lib/services-meta";
import { formatIQD, formatDate, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ImageIcon } from "lucide-react";
import { MaintenanceControls } from "@/components/services/maintenance-controls";

export const metadata = { title: "تفاصيل طلب الصيانة" };

export default async function MaintenanceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("maintenance", "VIEW");

  const req = await prisma.maintenanceRequest.findUnique({
    where: { id },
    include: {
      requester: { select: { fullName: true, email: true } },
      assignedEngineer: { select: { fullName: true } },
      report: true,
      visits: { orderBy: { visitDate: "desc" } },
      parts: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!req) notFound();

  const isRequester = req.requesterId === session.user.id;
  const isAdmin = isPlatformAdmin(session);
  const memberRole = isAdmin ? "MANAGER" : await myServiceRole(req.serviceId, session.user.id);
  const isMember = isAdmin || Boolean(memberRole);
  if (!isRequester && !isMember) notFound();

  const canAct = isAdmin || memberRole === "MANAGER" || req.assignedEngineerId === session.user.id;

  // Assign dropdown (team) and part picker (engineer) data.
  const engineers = isMember ? (await getMaintenanceTeam()).members.map((m) => ({ id: m.id, name: m.name })) : [];
  let marketItems: { id: string; name: string; price: string }[] = [];
  if (canAct) {
    const market = await getService("MARKET");
    if (market) {
      const items = await prisma.catalogItem.findMany({
        where: { serviceId: market.id, isActive: true },
        orderBy: [{ category: "asc" }, { name: "asc" }],
        select: { id: true, name: true, priceNormal: true },
      });
      marketItems = items.map((it) => ({ id: it.id, name: it.name, price: formatIQD(Number(it.priceNormal)) }));
    }
  }

  const total = req.report ? Number(req.report.totalCost) : null;

  return (
    <>
      <Link href="/maintenance" className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronRight className="h-4 w-4" /> العودة للصيانة
      </Link>

      <PageHeader title={req.requestNumber} description={req.deviceName}>
        <div className="flex items-center gap-2">
          <Badge tone={MAINTENANCE_PRIORITY_META[req.priority]?.tone ?? "muted"}>{MAINTENANCE_PRIORITY_META[req.priority]?.label}</Badge>
          <Badge tone={MAINTENANCE_STATUS_META[req.status]?.tone ?? "muted"}>{MAINTENANCE_STATUS_META[req.status]?.label}</Badge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <h3 className="mb-2 font-semibold text-fg">العطل</h3>
            <p className="text-sm text-fg-muted whitespace-pre-line">{req.description}</p>
            {req.cancelReason && <p className="mt-3 text-xs text-danger">سبب الإلغاء: {req.cancelReason}</p>}
          </Card>

          {req.mediaUrls.length > 0 && (
            <Card>
              <h3 className="mb-3 font-semibold text-fg">صور / فيديو</h3>
              <ul className="space-y-2">
                {req.mediaUrls.map((u, i) => (
                  <li key={i}>
                    <a href={u} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm text-primary hover:underline" dir="ltr">
                      <ImageIcon className="h-4 w-4 shrink-0" /> {u}
                    </a>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Card>
            <h3 className="mb-3 font-semibold text-fg">الزيارات ({req.visits.length})</h3>
            {req.visits.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-muted">لا توجد زيارات مسجّلة.</p>
            ) : (
              <ul className="space-y-2">
                {req.visits.map((v) => (
                  <li key={v.id} className="rounded-lg border border-border-soft bg-surface-2/40 p-3 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-fg">{formatDate(v.visitDate)}</span>
                      <span className="text-xs text-fg-faint">{v.engineerName}</span>
                    </div>
                    {v.notes && <p className="mt-1 text-xs text-fg-muted">{v.notes}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <h3 className="mb-3 font-semibold text-fg">قطع الغيار ({req.parts.length})</h3>
            {req.parts.length === 0 ? (
              <p className="py-4 text-center text-sm text-fg-muted">لا توجد قطع مرتبطة.</p>
            ) : (
              <div className="space-y-2">
                {req.parts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2 text-sm">
                    <span className="text-fg">{p.name} <span className="text-fg-faint">×{p.quantity}</span></span>
                    <span className="font-medium text-fg">{formatIQD(Number(p.lineTotal))}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {req.report && (
            <Card>
              <h3 className="mb-3 font-semibold text-fg">تقرير الصيانة</h3>
              <p className="text-sm text-fg-muted whitespace-pre-line">{req.report.diagnosis}</p>
              <div className="mt-3 space-y-1 border-t border-border-soft pt-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-fg-muted">الأجور</span><span className="text-fg">{formatIQD(Number(req.report.laborCost))}</span></div>
                <div className="flex items-center justify-between"><span className="text-fg-muted">قطع الغيار</span><span className="text-fg">{formatIQD(Number(req.report.partsCost))}</span></div>
                <div className="flex items-center justify-between border-t border-border-soft pt-1"><span className="font-medium text-fg-muted">الإجمالي</span><span className="font-bold text-primary">{formatIQD(Number(req.report.totalCost))}</span></div>
              </div>
              {req.report.authorName && <p className="mt-2 text-[11px] text-fg-faint">بقلم {req.report.authorName} · {formatDateTime(req.report.updatedAt)}</p>}
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <h3 className="mb-3 font-semibold text-fg">الطرف الطالب</h3>
            <p className="text-sm text-fg">{req.requester.fullName}</p>
            <p className="text-xs text-fg-muted" dir="ltr">{req.requester.email}</p>
            <div className="mt-3 border-t border-border-soft pt-3 text-sm">
              <span className="text-fg-muted">المهندس المسند: </span>
              <span className="text-fg">{req.assignedEngineer?.fullName ?? "—"}</span>
            </div>
            {req.acknowledgedAt && <p className="mt-2 text-xs text-success">أقرّ العميل بالتكلفة · {formatDate(req.acknowledgedAt)}</p>}
          </Card>

          <MaintenanceControls
            requestId={req.id}
            status={req.status}
            isRequester={isRequester}
            isMember={isMember}
            canAct={canAct}
            acknowledged={Boolean(req.acknowledgedAt)}
            hasReport={Boolean(req.report)}
            totalCostLabel={total === null ? null : formatIQD(total)}
            assignedEngineerId={req.assignedEngineerId}
            engineers={engineers}
            marketItems={marketItems}
            parts={req.parts.map((p) => ({ id: p.id, label: `${p.name} ×${p.quantity} · ${formatIQD(Number(p.lineTotal))}` }))}
            report={req.report ? { diagnosis: req.report.diagnosis, laborCost: Number(req.report.laborCost) } : null}
          />
        </div>
      </div>
    </>
  );
}
