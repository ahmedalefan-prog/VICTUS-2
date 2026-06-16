import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { myServiceRole } from "@/lib/services";
import {
  NEGOTIATION_STATUS_META,
  FULFILLMENT_STATUS_META,
  FULFILLMENT_TRANSITIONS,
  NEGOTIATION_ACTION_LABEL,
} from "@/lib/services-meta";
import { formatIQD, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight } from "lucide-react";
import { OrderControls, NegotiationThread } from "@/components/services/order-controls";

export const metadata = { title: "تفاصيل الطلب" };

export default async function MarketOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("market", "VIEW");

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      items: true,
      service: { select: { name: true } },
      requester: { select: { fullName: true, email: true } },
      negotiationEvents: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!order) notFound();

  const isRequester = order.requesterId === session.user.id;
  const isAdmin = isPlatformAdmin(session);
  const memberRole = isAdmin ? null : await myServiceRole(order.serviceId, session.user.id);
  const isMember = isAdmin || Boolean(memberRole);
  if (!isRequester && !isMember) notFound();

  const negotiating = ["PROPOSED", "COUNTERED"].includes(order.negotiationStatus);
  const agreed = order.negotiationStatus === "AGREED";
  const lastProposal = [...order.negotiationEvents].reverse().find((e) => e.action === "PROPOSE" || e.action === "COUNTER");
  const currentProposed = lastProposal?.price ? Number(lastProposal.price) : null;
  const iProposedLast = lastProposal?.actorId === session.user.id;
  const listedTotal = order.items.reduce((s, it) => s + Number(it.listedPrice) * it.quantity, 0);
  const allowedTransitions = FULFILLMENT_TRANSITIONS[order.fulfillmentStatus] ?? [];
  const closed = ["COMPLETED", "CANCELLED"].includes(order.fulfillmentStatus) || order.negotiationStatus === "CANCELLED";

  return (
    <>
      <Link href="/market/orders" className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronRight className="h-4 w-4" /> العودة للطلبات
      </Link>

      <PageHeader title={order.orderNumber} description={order.service.name}>
        <div className="flex items-center gap-2">
          <Badge tone={NEGOTIATION_STATUS_META[order.negotiationStatus]?.tone ?? "muted"}>{NEGOTIATION_STATUS_META[order.negotiationStatus]?.label}</Badge>
          {agreed && <Badge tone={FULFILLMENT_STATUS_META[order.fulfillmentStatus]?.tone ?? "muted"}>{FULFILLMENT_STATUS_META[order.fulfillmentStatus]?.label}</Badge>}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <h3 className="mb-3 font-semibold text-fg">المنتجات</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-fg-muted">
                  <tr className="border-b border-border-soft text-right">
                    <th className="pb-2 font-medium">المنتج</th>
                    <th className="pb-2 font-medium">الكمية</th>
                    <th className="pb-2 font-medium">السعر</th>
                    <th className="pb-2 font-medium">المجموع</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items.map((it) => (
                    <tr key={it.id} className="border-b border-border-soft/50">
                      <td className="py-2 text-fg">{it.name}</td>
                      <td className="py-2 text-fg">{it.quantity}</td>
                      <td className="py-2 text-fg-muted">{formatIQD(Number(it.listedPrice))}</td>
                      <td className="py-2 text-fg">{formatIQD(Number(it.listedPrice) * it.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-border-soft pt-3 text-sm">
              <span className="text-fg-muted">الإجمالي المعروض</span>
              <span className="font-medium text-fg">{formatIQD(listedTotal)}</span>
            </div>
            {order.agreedTotal !== null && (
              <div className="mt-1 flex items-center justify-between text-sm">
                <span className="text-fg-muted">الإجمالي المتّفق عليه</span>
                <span className="font-bold text-primary">{formatIQD(Number(order.agreedTotal))}</span>
              </div>
            )}
            {order.note && <p className="mt-3 text-xs text-fg-muted">ملاحظة: {order.note}</p>}
            {order.cancelReason && <p className="mt-2 text-xs text-danger">سبب الإلغاء: {order.cancelReason}</p>}
          </Card>

          {order.negotiationEvents.length > 0 && (
            <Card>
              <h3 className="mb-3 font-semibold text-fg">سجل التفاوض</h3>
              <NegotiationThread
                events={order.negotiationEvents.map((e) => ({
                  id: e.id,
                  actorName: e.actorName,
                  action: NEGOTIATION_ACTION_LABEL[e.action] ?? e.action,
                  price: e.price === null ? null : formatIQD(Number(e.price)),
                  note: e.note ?? "",
                  at: formatDateTime(e.createdAt),
                  mine: e.actorId === session.user.id,
                }))}
              />
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <Card>
            <h3 className="mb-3 font-semibold text-fg">الطرف الطالب</h3>
            <p className="text-sm text-fg">{order.requester.fullName}</p>
            <p className="text-xs text-fg-muted" dir="ltr">{order.requester.email}</p>
          </Card>

          <OrderControls
            orderId={order.id}
            isMember={isMember}
            negotiating={negotiating}
            agreed={agreed}
            closed={closed}
            currentProposed={currentProposed}
            currentProposedLabel={currentProposed === null ? null : formatIQD(currentProposed)}
            iProposedLast={iProposedLast}
            allowedTransitions={allowedTransitions}
            fulfillmentLabels={Object.fromEntries(allowedTransitions.map((s) => [s, FULFILLMENT_STATUS_META[s]?.label ?? s]))}
          />
        </div>
      </div>
    </>
  );
}
