import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "الوظائف والتوظيف" };

export default async function Page() {
  await requirePermission("jobs", "VIEW");
  return <ModulePlaceholder title="الوظائف والتوظيف" description="تصفّح وتقديم الوظائف للجميع" phase="المرحلة 5" />;
}
