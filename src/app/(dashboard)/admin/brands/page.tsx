import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { BrandManager } from "@/components/admin/brand-manager";

export const metadata = { title: "إدارة العلامات" };

export default async function AdminBrandsPage() {
  await requirePermission("brands", "MANAGE");
  const brands = await prisma.brand.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader title="إدارة العلامات التجارية" description="دليل العلامات الظاهر للجميع في صفحة العلامات.">
        <Badge tone="primary">{brands.length} علامة</Badge>
      </PageHeader>

      <BrandManager
        brands={brands.map((b) => ({
          id: b.id,
          name: b.name,
          category: b.category ?? "",
          country: b.country ?? "",
          website: b.website ?? "",
          logoUrl: b.logoUrl ?? "",
          about: b.about ?? "",
          isActive: b.isActive,
        }))}
      />
    </>
  );
}
