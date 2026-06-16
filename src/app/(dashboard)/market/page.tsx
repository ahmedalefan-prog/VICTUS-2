import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "خدمة السوق" };

export default async function Page() {
  await requirePermission("market", "VIEW");
  return <ModulePlaceholder title="خدمة السوق" description="كتالوج السوق (قطع غيار + أجهزة) — تصفّح للجميع" phase="المرحلة 3" />;
}
