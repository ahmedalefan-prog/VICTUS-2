import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { myServiceRole } from "@/lib/services";
import {
  ORDER_TIER_META,
  FULFILLMENT_STATUS_META,
  FULFILLMENT_TRANSITIONS,
} from "@/lib/services-meta";
import { formatIQD } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, FileText } from "lucide-react";
import { OrderControls } from "@/components/services/order-controls";
import { OrderOdontogram, RatingForm, RatingDisplay } from "@/components/services/lab-order-extras";

export const metadata = { title: "تفاصيل الطلب" };

export default async function LabOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("lab", "VIEW");

  const order = await prisma.serviceOrder.findUnique({
    where: { id },
    include: {
      items: true,
      service: { select: { name: true } },
      requester: { select: { fullName: true, email: true } },
      rating: true,
    },
  });
  if (!order) notFound();

  const isRequester = order.requesterId === session.user.id;
  const isAdmin = isPlatformAdmin(session);
  const memberRole = isAdmin ? null : await myServiceRole(order.serviceId, session.user.id);
  const isMember = isAdmin || Boolean(memberRole);
  if (!isRequester && !isMember) notFound();

  const listedTotal = order.items.reduce((s, it) => s + Number(it.listedPrice) * it.quantity, 0);
  const allowedTransitions = FULFILLMENT_TRANSITIONS[order.fulfillmentStatus] ?? [];
  const closed = ["COMPLETED", "CANCELLED"].includes(order.fulfillmentStatus);

  return (
    <>
      <Link href="/lab/orders" className="group mb-3 inline-flex items-center gap-1 text-sm text-fg-muted transition-colors hover:text-fg">
        <ChevronRight className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" /> العودة للطلبات
      </Link>

      <PageHeader title={order.orderNumber} description={order.service.name}>
        <Badge tone={FULFILLMENT_STATUS_META[order.fulfillmentStatus]?.tone ?? "muted"}>
          {FULFILLMENT_STATUS_META[order.fulfillmentStatus]?.label}
        </Badge>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <h3 className="mb-3 font-semibold text-fg">بنود الطلب التصنيعي</h3>
            <div className="space-y-2">
              {order.items.map((it) => (
                <div key={it.id} className="rounded-lg border border-border-soft bg-surface-2/40 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_16px_-8px_var(--primary)]">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-fg">{it.name}</span>
                      <Badge tone={ORDER_TIER_META[it.tier]?.tone ?? "muted"}>{ORDER_TIER_META[it.tier]?.label}</Badge>
                      {it.shade && <Badge tone="info">اللون: {it.shade}</Badge>}
                    </div>
                    <span className="text-sm font-medium text-fg">{it.quantity} وحدة · {formatIQD(Number(it.listedPrice) * it.quantity)}</span>
                  </div>
                  {it.teeth.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {it.teeth.map((t) => <span key={t} className="rounded bg-surface-3 px-1.5 py-0.5 text-[11px] tabular-nums text-fg-muted transition-colors hover:bg-primary-soft hover:text-primary">{t}</span>)}
                    </div>
                  )}
                  {it.itemNotes && <p className="mt-1.5 text-xs text-fg-muted">ملاحظة: {it.itemNotes}</p>}
                </div>
              ))}
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
            {order.note && <p className="mt-3 text-xs text-fg-muted">ملاحظة عامة: {order.note}</p>}
            {order.cancelReason && <p className="mt-2 text-xs text-danger">سبب الإلغاء: {order.cancelReason}</p>}
          </Card>

          {order.items.some((it) => it.teeth.length > 0) && (
            <Card>
              <h3 className="mb-3 font-semibold text-fg">مخطّط الأسنان</h3>
              <OrderOdontogram items={order.items.map((it) => ({ name: it.name, teeth: it.teeth }))} />
            </Card>
          )}

          {order.caseFiles.length > 0 && (
            <Card>
              <h3 className="mb-3 font-semibold text-fg">ملفات الحالة</h3>
              <ul className="space-y-2">
                {order.caseFiles.map((f, i) => (
                  <li key={i}>
                    <a href={f} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 text-sm text-primary transition-colors hover:text-primary-strong hover:underline" dir="ltr">
                      <FileText className="h-4 w-4 transition-transform group-hover:scale-110" /> {f}
                    </a>
                  </li>
                ))}
              </ul>
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
            closed={closed}
            allowedTransitions={allowedTransitions}
            fulfillmentLabels={Object.fromEntries(allowedTransitions.map((s) => [s, FULFILLMENT_STATUS_META[s]?.label ?? s]))}
          />

          {order.rating ? (
            <RatingDisplay quality={order.rating.quality} speed={order.rating.speed} commitment={order.rating.commitment} comment={order.rating.comment} />
          ) : (
            isRequester && order.fulfillmentStatus === "COMPLETED" && <RatingForm orderId={order.id} />
          )}
        </div>
      </div>
    </>
  );
}
