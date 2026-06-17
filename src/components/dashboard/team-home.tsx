import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  SERVICE_TYPE_META,
  FULFILLMENT_STATUS_META,
  MAINTENANCE_STATUS_META,
} from "@/lib/services-meta";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClipboardCheck, ChevronLeft } from "lucide-react";

interface QueueRow { id: string; number: string; statusLabel: string; tone: Parameters<typeof Badge>[0]["tone"]; at: Date; href: string; sub: string }

// Service-team dashboard: their own service's queue + stage stats + console link.
export async function TeamHome({ service }: { service: { id: string; type: string; name: string } }) {
  const isMaintenance = service.type === "MAINTENANCE";
  const resource = SERVICE_TYPE_META[service.type]?.resource ?? "lab";

  // stage buckets: جديد / قيد التنفيذ / جاهز / مكتمل
  const stats = { new: 0, inProgress: 0, ready: 0, completed: 0 };
  let queue: QueueRow[] = [];

  if (isMaintenance) {
    const reqs = await prisma.maintenanceRequest.findMany({
      where: { serviceId: service.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { requester: { select: { fullName: true } } },
    });
    for (const r of reqs) {
      if (r.status === "NEW") stats.new++;
      else if (r.status === "ASSIGNED" || r.status === "IN_PROGRESS") stats.inProgress++;
      else if (r.status === "AWAITING_CLOSURE") stats.ready++;
      else if (r.status === "COMPLETED") stats.completed++;
    }
    queue = reqs
      .filter((r) => !["COMPLETED", "CANCELLED"].includes(r.status))
      .slice(0, 12)
      .map((r) => ({ id: r.id, number: r.requestNumber, statusLabel: MAINTENANCE_STATUS_META[r.status]?.label ?? r.status, tone: MAINTENANCE_STATUS_META[r.status]?.tone ?? "muted", at: r.updatedAt, href: `/maintenance/${r.id}`, sub: r.requester.fullName }));
  } else {
    const orders = await prisma.serviceOrder.findMany({
      where: { serviceId: service.id },
      orderBy: { updatedAt: "desc" },
      take: 100,
      include: { requester: { select: { fullName: true } } },
    });
    for (const o of orders) {
      const s = o.fulfillmentStatus;
      if (s === "NEW") stats.new++;
      else if (s === "RECEIVED" || s === "IN_PROGRESS") stats.inProgress++;
      else if (s === "READY") stats.ready++;
      else if (s === "COMPLETED") stats.completed++;
    }
    queue = orders
      .filter((o) => !["COMPLETED", "CANCELLED"].includes(o.fulfillmentStatus))
      .slice(0, 12)
      .map((o) => ({ id: o.id, number: o.orderNumber, statusLabel: FULFILLMENT_STATUS_META[o.fulfillmentStatus]?.label ?? o.fulfillmentStatus, tone: FULFILLMENT_STATUS_META[o.fulfillmentStatus]?.tone ?? "muted", at: o.updatedAt, href: `/${resource}/orders/${o.id}`, sub: o.requester.fullName }));
  }

  const consoleHref = isMaintenance ? "/maintenance" : "/console";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="جديد" value={stats.new} tone="info" />
        <Stat label="قيد التنفيذ" value={stats.inProgress} tone="warning" />
        <Stat label="جاهز" value={stats.ready} tone="primary" />
        <Stat label="مكتمل" value={stats.completed} tone="success" />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-fg"><ClipboardCheck className="h-5 w-5 text-primary" /> طابور {service.name}</h2>
          <Link href={consoleHref} className="text-sm font-medium text-primary hover:underline">الكونسول ←</Link>
        </div>
        {queue.length === 0 ? (
          <p className="py-10 text-center text-sm text-fg-muted">لا توجد طلبات نشطة في الطابور.</p>
        ) : (
          <ul className="space-y-2">
            {queue.map((q) => (
              <li key={q.id}>
                <Link href={q.href} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2.5 transition-colors hover:border-primary/40">
                  <div>
                    <span className="font-medium text-fg">{q.number}</span>
                    <span className="mr-2 text-xs text-fg-muted">{q.sub} · {formatDate(q.at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={q.tone}>{q.statusLabel}</Badge>
                    <ChevronLeft className="h-4 w-4 text-fg-faint" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: Parameters<typeof Badge>[0]["tone"] }) {
  return (
    <Card className="flex flex-col items-center text-center">
      <Badge tone={tone}>{label}</Badge>
      <p className="mt-2 text-2xl font-bold text-fg">{value}</p>
    </Card>
  );
}
