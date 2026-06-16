import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "معاملات الخدمات" };

export default async function Page() {
  await requirePermission("transactions", "VIEW");
  return <ModulePlaceholder title="معاملات الخدمات" description="توثيق كل عمليات الخدمات + مجاميع + تصدير" phase="المرحلة 6" />;
}
