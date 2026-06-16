import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "العلامات التجارية" };

export default async function Page() {
  await requirePermission("brands", "VIEW");
  return <ModulePlaceholder title="العلامات التجارية" description="دليل العلامات التجارية" phase="المرحلة 5" />;
}
