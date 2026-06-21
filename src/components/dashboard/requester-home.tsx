import Link from "next/link";
import { prisma } from "@/lib/prisma";
import {
  SERVICE_TYPE_META,
  FULFILLMENT_STATUS_META,
  MAINTENANCE_STATUS_META,
  MAINTENANCE_OPEN_STATUSES,
} from "@/lib/services-meta";
import { formatDate } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { AdSlot } from "@/components/ads/ad-slot";
import { FlaskConical, Store, Wrench, ClipboardList, ChevronLeft } from "lucide-react";

interface Row {
  key: string;
  typeLabel: string;
  number: string;
  statusLabel: string;
  tone: Parameters<typeof Badge>[0]["tone"];
  at: Date;
  href: string;
}

export async function RequesterHome({ userId }: { userId: string }) {
  const [orders, requests] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: { requesterId: userId, fulfillmentStatus: { notIn: ["COMPLETED", "CANCELLED"] } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, orderNumber: true, serviceType: true, fulfillmentStatus: true, updatedAt: true },
    }),
    prisma.maintenanceRequest.findMany({
      where: { requesterId: userId, status: { in: MAINTENANCE_OPEN_STATUSES as never } },
      orderBy: { updatedAt: "desc" },
      take: 20,
      select: { id: true, requestNumber: true, status: true, updatedAt: true },
    }),
  ]);

  const rows: Row[] = [
    ...orders.map((o) => ({
      key: o.id,
      typeLabel: SERVICE_TYPE_META[o.serviceType]?.label ?? o.serviceType,
      number: o.orderNumber,
      statusLabel: FULFILLMENT_STATUS_META[o.fulfillmentStatus]?.label ?? o.fulfillmentStatus,
      tone: FULFILLMENT_STATUS_META[o.fulfillmentStatus]?.tone ?? "muted",
      at: o.updatedAt,
      href: `/${SERVICE_TYPE_META[o.serviceType]?.resource}/orders/${o.id}`,
    })),
    ...requests.map((r) => ({
      key: r.id,
      typeLabel: "الصيانة",
      number: r.requestNumber,
      statusLabel: MAINTENANCE_STATUS_META[r.status]?.label ?? r.status,
      tone: MAINTENANCE_STATUS_META[r.status]?.tone ?? "muted",
      at: r.updatedAt,
      href: `/maintenance/${r.id}`,
    })),
  ].sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <div className="space-y-6">
      <Card>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold text-fg"><ClipboardList className="h-5 w-5 text-primary" /> الطلبات الجارية</h2>
          {rows.length > 0 && <Badge tone="warning">{rows.length} نشط</Badge>}
        </div>
        {rows.length === 0 ? (
          <EmptyState title="لا توجد طلبات جارية" description="ابدأ بطلب من إحدى الخدمات أدناه." />
        ) : (
          <ul className="stagger-children space-y-2">
            {rows.map((r) => (
              <li key={r.key}>
                <Link href={r.href} className="group flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2.5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_20px_-8px_var(--primary)]">
                  <div className="flex items-center gap-2">
                    <Badge tone="info">{r.typeLabel}</Badge>
                    <span className="font-medium text-fg transition-colors group-hover:text-primary">{r.number}</span>
                    <span className="text-xs text-fg-faint">آخر تحديث {formatDate(r.at)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={r.tone}>{r.statusLabel}</Badge>
                    <ChevronLeft className="h-4 w-4 text-fg-faint transition-transform group-hover:-translate-x-0.5" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <div>
        <h2 className="mb-3 font-semibold text-fg">اطلب خدمة</h2>
        <div className="stagger-children grid grid-cols-1 gap-3 sm:grid-cols-3">
          <OrderButton href="/lab" icon={<FlaskConical className="h-6 w-6" />} title="اطلب من المختبر" desc="تركيبات سنية" />
          <OrderButton href="/market" icon={<Store className="h-6 w-6" />} title="اطلب من السوق" desc="قطع غيار وأجهزة" />
          <OrderButton href="/maintenance" icon={<Wrench className="h-6 w-6" />} title="اطلب صيانة" desc="صيانة الأجهزة" />
        </div>
      </div>

      <AdSlot placement="DASHBOARD" />
    </div>
  );
}

function OrderButton({ href, icon, title, desc }: { href: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link href={href}>
      <Card className="group flex items-center gap-3 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_8px_30px_-12px_var(--primary)]">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-all duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-[var(--primary-fg)]">{icon}</span>
        <div>
          <p className="font-semibold text-fg transition-colors group-hover:text-primary">{title}</p>
          <p className="text-xs text-fg-muted">{desc}</p>
        </div>
      </Card>
    </Link>
  );
}
