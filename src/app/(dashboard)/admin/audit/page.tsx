import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "سجل العمليات" };

export default async function Page() {
  await requirePermission("audit", "VIEW");
  return <ModulePlaceholder title="سجل العمليات" description="سجل العمليات الأمنية" phase="المرحلة 6" />;
}
