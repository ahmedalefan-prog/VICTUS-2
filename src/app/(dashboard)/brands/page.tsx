import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tags, ExternalLink } from "lucide-react";

export const metadata = { title: "العلامات التجارية" };

export default async function BrandsPage() {
  await requirePermission("brands", "VIEW");
  const brands = await prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });

  return (
    <>
      <PageHeader title="دليل العلامات التجارية" description="العلامات والشركات في قطاع طب الأسنان.">
        <Badge tone="primary">{brands.length} علامة</Badge>
      </PageHeader>

      {brands.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Tags className="mb-3 h-10 w-10 text-fg-faint" />
          <p className="font-medium text-fg">لا توجد علامات بعد</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((b) => (
            <Card key={b.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                {b.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- external brand logos
                  <img src={b.logoUrl} alt={b.name} className="h-12 w-12 rounded-lg object-contain bg-surface-2" />
                ) : (
                  <span className="flex h-12 w-12 items-center justify-center rounded-lg bg-surface-2 text-fg-faint"><Tags className="h-5 w-5" /></span>
                )}
                <div>
                  <p className="font-semibold text-fg">{b.name}</p>
                  <p className="text-xs text-fg-muted">{[b.category, b.country].filter(Boolean).join(" · ") || "—"}</p>
                </div>
              </div>
              {b.about && <p className="line-clamp-2 text-xs text-fg-muted">{b.about}</p>}
              {b.website && (
                <a href={b.website} target="_blank" rel="noopener noreferrer" className="mt-auto flex items-center gap-1 text-xs text-primary hover:underline" dir="ltr">
                  <ExternalLink className="h-3.5 w-3.5" /> {b.website}
                </a>
              )}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
