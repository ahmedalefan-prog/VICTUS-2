import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "خدمة المختبر" };

export default async function Page() {
  await requirePermission("lab", "VIEW");
  return <ModulePlaceholder title="خدمة المختبر" description="كتالوج أسعار المختبر (عادي/VIP) — تصفّح للجميع، طلب للأطباء والعيادات" phase="المرحلة 2" />;
}
