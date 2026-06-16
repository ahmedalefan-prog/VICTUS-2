import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { getService, canRequest } from "@/lib/services";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MarketCart } from "@/components/services/market-cart";

export const metadata = { title: "السوق" };

export default async function MarketPage() {
  const session = await requirePermission("market", "VIEW");
  const service = await getService("MARKET");

  if (!service || !service.isActive || service.mode === "OFF") {
    return (
      <>
        <PageHeader title="خدمة السوق" />
        <Card className="py-16 text-center text-fg-muted">خدمة السوق غير مُفعّلة حالياً.</Card>
      </>
    );
  }

  const items = await prisma.catalogItem.findMany({
    where: { serviceId: service.id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const canOrder = canRequest(session, "MARKET");

  return (
    <>
      <PageHeader title={service.name} description={service.about ?? "قطع الغيار والأجهزة"}>
        <div className="flex items-center gap-2">
          <Badge tone="primary">خدمة رسمية</Badge>
          {canOrder && <Link href="/market/orders" className="text-sm font-medium text-primary hover:underline">طلباتي ←</Link>}
        </div>
      </PageHeader>

      <MarketCart
        canOrder={canOrder}
        items={items.map((it) => ({
          id: it.id,
          name: it.name,
          description: it.description ?? "",
          imageUrl: it.imageUrl ?? "",
          category: it.category ?? "",
          condition: it.condition ?? null,
          priceNormal: Number(it.priceNormal),
          unit: it.unit ?? "",
          stock: it.stock === null ? null : Number(it.stock),
          bulkThreshold: it.bulkThreshold ?? null,
        }))}
      />
    </>
  );
}
