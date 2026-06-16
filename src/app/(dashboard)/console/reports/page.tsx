import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { resolveMyService } from "@/lib/services";
import { NEGOTIATION_STATUS_META, FULFILLMENT_STATUS_META } from "@/lib/services-meta";
import { formatIQD, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Handshake } from "lucide-react";

export const metadata = { title: "تقارير الخدمة" };

const PRICE_FIELD_LABEL: Record<string, string> = {
  priceNormal: "السعر العادي",
  priceVip: "سعر VIP",
  stock: "المخزون",
};

export default async function ConsoleReportsPage() {
  const session = await requirePermission("services", "VIEW");
  const service = await resolveMyService(session.user.id);

  if (!service) {
    return (
      <>
        <PageHeader title="تقارير الخدمة" />
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Handshake className="mb-3 h-10 w-10 text-fg-faint" />
          <p className="font-medium text-fg">لست عضواً في أي خدمة</p>
        </Card>
      </>
    );
  }

  const [orders, priceLogs, negEvents, txAgg] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: { serviceId: service.id },
      select: { negotiationStatus: true, fulfillmentStatus: true, agreedTotal: true },
    }),
    prisma.priceChangeLog.findMany({ where: { serviceId: service.id }, orderBy: { createdAt: "desc" }, take: 40 }),
    prisma.negotiationEvent.findMany({ where: { order: { serviceId: service.id } }, select: { actorId: true, actorName: true } }),
    prisma.partnerTransaction.aggregate({ where: { serviceId: service.id }, _sum: { agreedAmount: true }, _count: true }),
  ]);

  const negCounts: Record<string, number> = {};
  const fulCounts: Record<string, number> = {};
  let agreedValue = 0;
  for (const o of orders) {
    if (o.negotiationStatus !== "AGREED") {
      negCounts[o.negotiationStatus] = (negCounts[o.negotiationStatus] ?? 0) + 1;
    } else {
      fulCounts[o.fulfillmentStatus] = (fulCounts[o.fulfillmentStatus] ?? 0) + 1;
      if (o.agreedTotal !== null) agreedValue += Number(o.agreedTotal);
    }
  }

  const activity = new Map<string, { name: string; negotiations: number; priceEdits: number }>();
  for (const e of negEvents) {
    const a = activity.get(e.actorId) ?? { name: e.actorName, negotiations: 0, priceEdits: 0 };
    a.negotiations++;
    activity.set(e.actorId, a);
  }
  for (const p of priceLogs) {
    const a = activity.get(p.actorId) ?? { name: p.actorName, negotiations: 0, priceEdits: 0 };
    a.priceEdits++;
    activity.set(p.actorId, a);
  }

  return (
    <>
      <Link href="/console" className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronRight className="h-4 w-4" /> العودة للكونسول
      </Link>
      <PageHeader title={`تقارير ${service.name}`} description="نشاط خدمتك — منفصل عن لوحة الإدارة.">
        <Badge tone="primary">{orders.length} طلب</Badge>
      </PageHeader>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="border-primary/30">
          <p className="text-xs text-fg-muted">قيمة الطلبات المتّفقة</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatIQD(agreedValue)}</p>
        </Card>
        <Card>
          <p className="text-xs text-fg-muted">إجمالي المعاملات الموثّقة</p>
          <p className="mt-1 text-xl font-bold text-fg">{formatIQD(Number(txAgg._sum.agreedAmount ?? 0))}</p>
          <p className="mt-0.5 text-xs text-fg-faint">{txAgg._count} معاملة</p>
        </Card>
        <Card>
          <p className="text-xs text-fg-muted">طلبات قيد التفاوض</p>
          <p className="mt-1 text-xl font-bold text-fg">{(negCounts.PROPOSED ?? 0) + (negCounts.COUNTERED ?? 0)}</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-semibold text-fg">الطلبات حسب الحالة</h3>
          <div className="space-y-2 text-sm">
            {Object.entries(negCounts).map(([s, n]) => (
              <div key={s} className="flex items-center justify-between">
                <Badge tone={NEGOTIATION_STATUS_META[s]?.tone ?? "muted"}>{NEGOTIATION_STATUS_META[s]?.label ?? s}</Badge>
                <span className="font-medium text-fg">{n}</span>
              </div>
            ))}
            {Object.entries(fulCounts).map(([s, n]) => (
              <div key={s} className="flex items-center justify-between">
                <Badge tone={FULFILLMENT_STATUS_META[s]?.tone ?? "muted"}>{FULFILLMENT_STATUS_META[s]?.label ?? s}</Badge>
                <span className="font-medium text-fg">{n}</span>
              </div>
            ))}
            {orders.length === 0 && <p className="text-fg-muted">لا توجد طلبات بعد.</p>}
          </div>
        </Card>

        <Card>
          <h3 className="mb-3 font-semibold text-fg">نشاط الأعضاء</h3>
          {activity.size === 0 ? (
            <p className="text-sm text-fg-muted">لا يوجد نشاط بعد.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {[...activity.values()].map((a, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2">
                  <span className="font-medium text-fg">{a.name}</span>
                  <span className="text-xs text-fg-muted">{a.negotiations} تفاوض · {a.priceEdits} تعديل سعر</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-5">
        <h3 className="mb-3 font-semibold text-fg">سجل تغيّر الأسعار</h3>
        {priceLogs.length === 0 ? (
          <p className="text-sm text-fg-muted">لا توجد تغييرات أسعار بعد.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-fg-muted">
                <tr className="border-b border-border-soft text-right">
                  <th className="pb-2 font-medium">التاريخ</th>
                  <th className="pb-2 font-medium">العضو</th>
                  <th className="pb-2 font-medium">الحقل</th>
                  <th className="pb-2 font-medium">القديمة</th>
                  <th className="pb-2 font-medium">الجديدة</th>
                </tr>
              </thead>
              <tbody>
                {priceLogs.map((p) => (
                  <tr key={p.id} className="border-b border-border-soft/50">
                    <td className="py-2 text-fg-muted">{formatDateTime(p.createdAt)}</td>
                    <td className="py-2 text-fg">{p.actorName}</td>
                    <td className="py-2 text-fg">{PRICE_FIELD_LABEL[p.field] ?? p.field}</td>
                    <td className="py-2 text-fg-muted">{p.oldValue === null ? "—" : formatIQD(Number(p.oldValue))}</td>
                    <td className="py-2 text-fg">{p.newValue === null ? "—" : formatIQD(Number(p.newValue))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  );
}
