import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "إدارة العلامات" };

export default async function Page() {
  await requirePermission("brands", "MANAGE");
  return <ModulePlaceholder title="إدارة العلامات" description="إدارة دليل العلامات التجارية" phase="المرحلة 5" />;
}
