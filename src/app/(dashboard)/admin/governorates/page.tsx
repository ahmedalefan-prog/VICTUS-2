import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { AD_PLACEMENTS } from "@/lib/ads";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin } from "lucide-react";

export const metadata = { title: "المحافظات" };

export default async function GovernoratesPage() {
  await requirePermission("governorates", "VIEW");

  const governorates = await prisma.governorate.findMany({
    orderBy: { nameAr: "asc" },
    include: { _count: { select: { districts: true, users: true } } },
  });

  return (
    <>
      <PageHeader title="المحافظات والجغرافيا" description="بيانات الجغرافيا العراقية المستخدمة عبر المنصة.">
        <Badge tone="primary">{governorates.length} محافظة</Badge>
      </PageHeader>

      <Card className="mb-5 p-0">
        <div className="border-b border-border-soft p-4">
          <h3 className="font-semibold text-fg">المحافظات العراقية</h3>
        </div>
        <div className="grid grid-cols-1 gap-px bg-border-soft/40 sm:grid-cols-2 lg:grid-cols-3">
          {governorates.map((g) => (
            <div key={g.id} className="flex items-center justify-between bg-surface p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-primary" />
                <div>
                  <p className="font-medium text-fg">{g.nameAr}</p>
                  <p className="text-xs text-fg-faint" dir="ltr">{g.nameEn} · {g.code}</p>
                </div>
              </div>
              <div className="text-left text-xs text-fg-muted">
                <p>{g._count.districts} قضاء</p>
                <p>{g._count.users} مستخدم</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="mb-3 font-semibold text-fg">أماكن عرض الإعلانات</h3>
        <div className="flex flex-wrap gap-2">
          {AD_PLACEMENTS.map((p) => <Badge key={p.key} tone="muted">{p.label}</Badge>)}
        </div>
      </Card>
    </>
  );
}
