import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { NEGOTIATION_STATUS_META, FULFILLMENT_STATUS_META } from "@/lib/services-meta";
import { formatIQD, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, ChevronLeft } from "lucide-react";

export const metadata = { title: "طلبات المختبر" };

export default async function LabOrdersPage() {
  const session = await requirePermission("lab", "VIEW");

  const orders = await prisma.serviceOrder.findMany({
    where: { requesterId: session.user.id, serviceType: "LAB" },
    include: { service: { select: { name: true } }, _count: { select: { items: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader title="طلبات المختبر" description="طلباتك لدى خدمة المختبر وحالاتها.">
        <Badge tone="primary">{orders.length} طلب</Badge>
      </PageHeader>

      {orders.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <ShoppingCart className="mb-3 h-10 w-10 text-fg-faint" />
          <p className="font-medium text-fg">لا توجد طلبات بعد</p>
          <p className="mt-1 text-sm text-fg-muted">تصفّح كتالوج المختبر لإنشاء طلب.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/lab/orders/${o.id}`}>
              <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-primary/40">
                <div>
                  <p className="font-semibold text-fg">{o.orderNumber}</p>
                  <p className="mt-1 text-xs text-fg-muted">
                    {o.service.name} · {o._count.items} عنصر · {formatDate(o.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {o.negotiationStatus !== "AGREED" ? (
                    <Badge tone={NEGOTIATION_STATUS_META[o.negotiationStatus]?.tone ?? "muted"}>
                      {NEGOTIATION_STATUS_META[o.negotiationStatus]?.label}
                    </Badge>
                  ) : (
                    <Badge tone={FULFILLMENT_STATUS_META[o.fulfillmentStatus]?.tone ?? "muted"}>
                      {FULFILLMENT_STATUS_META[o.fulfillmentStatus]?.label}
                    </Badge>
                  )}
                  {o.agreedTotal !== null && (
                    <span className="text-sm font-medium text-fg">{formatIQD(Number(o.agreedTotal))}</span>
                  )}
                  <ChevronLeft className="h-4 w-4 text-fg-faint" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
