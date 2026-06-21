import { Suspense } from "react";
import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { getService, canRequest } from "@/lib/services";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonCard } from "@/components/ui/skeleton";
import { MarketCart } from "@/components/services/market-cart";
import { AdSlot } from "@/components/ads/ad-slot";

export const metadata = { title: "السوق" };

async function MarketContent() {
  const session = await requirePermission("market", "VIEW");
  const service = await getService("MARKET");

  if (!service || !service.isActive || service.mode === "OFF") {
    return <Card className="py-16 text-center text-fg-muted">خدمة السوق غير مُفعّلة حالياً.</Card>;
  }

  const items = await prisma.catalogItem.findMany({
    where: { serviceId: service.id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const canOrder = canRequest(session, "MARKET");

  return (
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
      }))}
    />
  );
}

function MarketFallback() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default async function MarketPage() {
  const session = await requirePermission("market", "VIEW");
  const service = await getService("MARKET");

  return (
    <>
      <PageHeader title={service?.name ?? "السوق"} description={service?.about ?? "قطع الغيار والأجهزة"}>
        <div className="flex items-center gap-2">
          <Badge tone="primary">خدمة رسمية</Badge>
          {canRequest(session, "MARKET") && (
            <Link href="/market/orders" className="text-sm font-medium text-primary hover:underline">طلباتي ←</Link>
          )}
        </div>
      </PageHeader>

      <AdSlot placement="MARKET" />

      <Suspense fallback={<MarketFallback />}>
        <MarketContent />
      </Suspense>
    </>
  );
}
