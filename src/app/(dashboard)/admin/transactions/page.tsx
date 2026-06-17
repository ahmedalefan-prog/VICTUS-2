import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { SERVICE_TYPE_META, TX_STATUS_META } from "@/lib/services-meta";
import { formatIQD, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollText } from "lucide-react";
import { buildTxWhere } from "./filters";
import { TxFilters, ExportButton } from "./client";

export const metadata = { title: "معاملات الخدمات" };

const TX_TYPES = ["LAB", "MARKET", "MAINTENANCE"];

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ serviceId?: string; type?: string; status?: string; from?: string; to?: string }>;
}) {
  await requirePermission("transactions", "VIEW");
  const sp = await searchParams;
  const filters = {
    serviceId: sp.serviceId || undefined,
    type: sp.type || undefined,
    status: sp.status || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
  };
  const where = buildTxWhere(filters);

  const [rows, services, totalsByService, grand] = await Promise.all([
    prisma.partnerTransaction.findMany({ where, orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.service.findMany({ select: { id: true, name: true }, orderBy: { createdAt: "asc" } }),
    prisma.partnerTransaction.groupBy({ by: ["serviceId"], where, _sum: { agreedAmount: true }, _count: true }),
    prisma.partnerTransaction.aggregate({ where, _sum: { agreedAmount: true }, _count: true }),
  ]);

  return (
    <>
      <PageHeader title="سجل معاملات الخدمات" description="توثيق كل عمليات الخدمات بالمبلغ النهائي المتّفق — مرجع الإدارة لاستقطاع النِّسب يدوياً.">
        <ExportButton filters={filters} />
      </PageHeader>

      <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-primary/30">
          <p className="text-xs text-fg-muted">الإجمالي العام</p>
          <p className="mt-1 text-xl font-bold text-primary">{formatIQD(Number(grand._sum.agreedAmount ?? 0))}</p>
          <p className="mt-0.5 text-xs text-fg-faint">{grand._count} عملية</p>
        </Card>
        {totalsByService.map((t) => (
          <Card key={t.serviceId}>
            <p className="truncate text-xs text-fg-muted">{services.find((s) => s.id === t.serviceId)?.name ?? "—"}</p>
            <p className="mt-1 text-lg font-bold text-fg">{formatIQD(Number(t._sum.agreedAmount ?? 0))}</p>
            <p className="mt-0.5 text-xs text-fg-faint">{t._count} عملية</p>
          </Card>
        ))}
      </div>

      <Card className="mb-5">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6" method="get">
          <select name="serviceId" defaultValue={filters.serviceId ?? ""} className="h-11 rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-fg">
            <option value="">كل الخدمات</option>
            {services.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select name="type" defaultValue={filters.type ?? ""} className="h-11 rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-fg">
            <option value="">كل الأنواع</option>
            {TX_TYPES.map((t) => <option key={t} value={t}>{SERVICE_TYPE_META[t]?.label ?? t}</option>)}
          </select>
          <select name="status" defaultValue={filters.status ?? ""} className="h-11 rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-fg">
            <option value="">كل الحالات</option>
            {Object.entries(TX_STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
          <input type="date" name="from" defaultValue={filters.from ?? ""} className="h-11 rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-fg" />
          <input type="date" name="to" defaultValue={filters.to ?? ""} className="h-11 rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-fg" />
          <TxFilters />
        </form>
      </Card>

      <Card>
        {rows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ScrollText className="mb-3 h-10 w-10 text-fg-faint" />
            <p className="font-medium text-fg">لا توجد معاملات مطابقة</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-fg-muted">
                <tr className="border-b border-border-soft text-right">
                  <th className="pb-2 font-medium">التاريخ</th>
                  <th className="pb-2 font-medium">النوع</th>
                  <th className="pb-2 font-medium">الخدمة</th>
                  <th className="pb-2 font-medium">المرجع</th>
                  <th className="pb-2 font-medium">البند</th>
                  <th className="pb-2 font-medium">صاحب الطلب</th>
                  <th className="pb-2 font-medium">المبلغ</th>
                  <th className="pb-2 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-b border-border-soft/50">
                    <td className="py-2 text-fg-muted">{formatDate(r.createdAt)}</td>
                    <td className="py-2"><Badge tone="info">{SERVICE_TYPE_META[r.type]?.label ?? r.type}</Badge></td>
                    <td className="py-2 text-fg">{r.serviceName}</td>
                    <td className="py-2 text-fg-muted">{r.referenceId}</td>
                    <td className="py-2 text-fg">{r.serviceLabel}{r.tier ? ` · ${r.tier}` : ""}</td>
                    <td className="py-2 text-fg-muted">{r.requesterName}</td>
                    <td className="py-2 font-medium text-fg">{formatIQD(Number(r.agreedAmount))}</td>
                    <td className="py-2"><Badge tone={TX_STATUS_META[r.status]?.tone ?? "muted"}>{TX_STATUS_META[r.status]?.label}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {rows.length === 500 && <p className="mt-3 text-xs text-fg-faint">عُرضت أول 500 عملية — استخدم الفلاتر أو التصدير للمزيد.</p>}
      </Card>

      <p className="mt-4 text-xs text-fg-faint">ملاحظة: المنصة توثّق المبلغ النهائي فقط — لا تُحتسب أي نِسب آلياً.</p>
    </>
  );
}
