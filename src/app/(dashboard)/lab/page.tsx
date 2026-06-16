import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { getService, canRequest } from "@/lib/services";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CatalogShop } from "@/components/services/catalog-shop";
import { LabOrderBuilder } from "@/components/services/lab-order-builder";

export const metadata = { title: "المختبر" };

export default async function LabPage() {
  const session = await requirePermission("lab", "VIEW");
  const service = await getService("LAB");

  if (!service || !service.isActive || service.mode === "OFF") {
    return (
      <>
        <PageHeader title="خدمة المختبر" />
        <Card className="py-16 text-center text-fg-muted">خدمة المختبر غير مُفعّلة حالياً.</Card>
      </>
    );
  }

  const items = await prisma.catalogItem.findMany({
    where: { serviceId: service.id, isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  const canOrder = canRequest(session, "LAB");

  return (
    <>
      <PageHeader title={service.name} description={service.about ?? "كتالوج خدمات المختبر"}>
        <div className="flex items-center gap-2">
          <Badge tone="primary">خدمة رسمية</Badge>
          {canOrder && (
            <Link href="/lab/orders" className="text-sm font-medium text-primary hover:underline">
              طلباتي ←
            </Link>
          )}
        </div>
      </PageHeader>

      {canOrder ? (
        <LabOrderBuilder
          items={items.map((it) => ({
            id: it.id,
            name: it.name,
            description: it.description ?? "",
            imageUrl: it.imageUrl ?? "",
            priceNormal: Number(it.priceNormal),
            priceVip: it.priceVip === null ? null : Number(it.priceVip),
          }))}
        />
      ) : (
        <CatalogShop
          serviceType="LAB"
          canOrder={false}
          items={items.map((it) => ({
            id: it.id,
            name: it.name,
            description: it.description ?? "",
            imageUrl: it.imageUrl ?? "",
            category: it.category ?? "",
            condition: it.condition ?? null,
            priceNormal: Number(it.priceNormal),
            priceVip: it.priceVip === null ? null : Number(it.priceVip),
            unit: it.unit ?? "",
            stock: it.stock === null ? null : Number(it.stock),
          }))}
        />
      )}
    </>
  );
}
