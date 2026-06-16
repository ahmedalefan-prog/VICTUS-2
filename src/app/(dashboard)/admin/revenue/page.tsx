import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "إيرادات الإعلانات" };

export default async function Page() {
  await requirePermission("reports", "VIEW");
  return <ModulePlaceholder title="إيرادات الإعلانات" description="تقارير إيرادات الإعلانات" phase="المرحلة 6" />;
}
