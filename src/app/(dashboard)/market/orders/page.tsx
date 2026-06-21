import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { FULFILLMENT_STATUS_META } from "@/lib/services-meta";
import { formatIQD, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Pagination } from "@/components/ui/pagination";
import { ChevronLeft } from "lucide-react";

export const metadata = { title: "طلبات السوق" };

const PAGE_SIZE = 20;

export default async function MarketOrdersPage(props: { searchParams: Promise<{ page?: string }> }) {
  const session = await requirePermission("market", "VIEW");
  const searchParams = await props.searchParams;
  const page = Math.max(1, Number(searchParams.page) || 1);

  const [orders, total] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: { requesterId: session.user.id, serviceType: "MARKET" },
      include: { service: { select: { name: true } }, _count: { select: { items: true } } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.serviceOrder.count({ where: { requesterId: session.user.id, serviceType: "MARKET" } }),
  ]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <>
      <PageHeader title="طلبات السوق" description="طلباتك لدى خدمة السوق وحالاتها.">
        <Badge tone="primary">{total} طلب</Badge>
      </PageHeader>

      {orders.length === 0 ? (
        <EmptyState title="لا توجد طلبات بعد" description="تصفّح كتالوج السوق لإنشاء طلب." />
      ) : (
        <div className="stagger-children space-y-3">
          {orders.map((o) => (
            <Link key={o.id} href={`/market/orders/${o.id}`}>
              <Card className="group flex flex-wrap items-center justify-between gap-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_20px_-8px_var(--primary)]">
                <div>
                  <p className="font-semibold text-fg transition-colors group-hover:text-primary">{o.orderNumber}</p>
                  <p className="mt-1 text-xs text-fg-muted">{o.service.name} · {o._count.items} عنصر · {formatDate(o.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={FULFILLMENT_STATUS_META[o.fulfillmentStatus]?.tone ?? "muted"}>{FULFILLMENT_STATUS_META[o.fulfillmentStatus]?.label}</Badge>
                  {o.agreedTotal !== null && <span className="text-sm font-medium text-fg">{formatIQD(Number(o.agreedTotal))}</span>}
                  <ChevronLeft className="h-4 w-4 text-fg-faint transition-transform group-hover:-translate-x-0.5" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
      <Pagination currentPage={page} totalPages={totalPages} baseHref="/market/orders" />
    </>
  );
}
