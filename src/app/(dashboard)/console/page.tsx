import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { resolveMyService } from "@/lib/services";
import { SERVICE_TYPE_META, NEGOTIATION_STATUS_META, FULFILLMENT_STATUS_META } from "@/lib/services-meta";
import { formatIQD, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Handshake, ChevronLeft } from "lucide-react";
import { CatalogManager } from "@/components/services/catalog-manager";

export const metadata = { title: "كونسول الخدمة" };

export default async function ConsolePage() {
  const session = await requirePermission("services", "VIEW");
  const service = await resolveMyService(session.user.id);

  if (!service) {
    return (
      <>
        <PageHeader title="كونسول الخدمة" />
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Handshake className="mb-3 h-10 w-10 text-fg-faint" />
          <p className="font-medium text-fg">لست عضواً في أي خدمة</p>
          <p className="mt-1 text-sm text-fg-muted">هذه الصفحة مخصّصة لأعضاء فِرَق الخدمات.</p>
        </Card>
      </>
    );
  }

  const resource = SERVICE_TYPE_META[service.type].resource;
  const [items, orders] = await Promise.all([
    prisma.catalogItem.findMany({
      where: { serviceId: service.id },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.serviceOrder.findMany({
      where: { serviceId: service.id },
      include: { requester: { select: { fullName: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ]);

  const activeOrders = orders.filter(
    (o) => o.negotiationStatus !== "CANCELLED" && !["COMPLETED", "CANCELLED"].includes(o.fulfillmentStatus),
  ).length;

  return (
    <>
      <PageHeader title={`كونسول ${service.name}`} description="إدارة الطلبات الواردة وكتالوج الأسعار.">
        <div className="flex items-center gap-2">
          <Badge tone="info">{SERVICE_TYPE_META[service.type].label}</Badge>
          <Link href="/console/reports" className="text-sm font-medium text-primary hover:underline">التقارير ←</Link>
        </div>
      </PageHeader>

      <Card className="mb-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-semibold text-fg">الطلبات الواردة</h3>
          {activeOrders > 0 && <Badge tone="warning">{activeOrders} نشط</Badge>}
        </div>
        {orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">لا توجد طلبات واردة بعد.</p>
        ) : (
          <ul className="space-y-2">
            {orders.map((o) => (
              <li key={o.id}>
                <Link href={`/${resource}/orders/${o.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2.5 transition-colors hover:border-primary/40">
                  <div>
                    <span className="font-medium text-fg">{o.orderNumber}</span>
                    <span className="mr-2 text-xs text-fg-muted">{o.requester.fullName} · {o._count.items} عنصر · {formatDate(o.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.negotiationStatus !== "AGREED" ? (
                      <Badge tone={NEGOTIATION_STATUS_META[o.negotiationStatus]?.tone ?? "muted"}>{NEGOTIATION_STATUS_META[o.negotiationStatus]?.label}</Badge>
                    ) : (
                      <Badge tone={FULFILLMENT_STATUS_META[o.fulfillmentStatus]?.tone ?? "muted"}>{FULFILLMENT_STATUS_META[o.fulfillmentStatus]?.label}</Badge>
                    )}
                    {o.agreedTotal !== null && <span className="text-sm font-medium text-fg">{formatIQD(Number(o.agreedTotal))}</span>}
                    <ChevronLeft className="h-4 w-4 text-fg-faint" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <CatalogManager
        serviceType={service.type}
        items={items.map((it) => ({
          id: it.id,
          name: it.name,
          description: it.description ?? "",
          imageUrl: it.imageUrl ?? "",
          category: it.category ?? "",
          condition: it.condition ?? "",
          priceNormal: Number(it.priceNormal),
          priceVip: it.priceVip === null ? null : Number(it.priceVip),
          unit: it.unit ?? "",
          stock: it.stock === null ? null : Number(it.stock),
          isActive: it.isActive,
        }))}
      />
    </>
  );
}
