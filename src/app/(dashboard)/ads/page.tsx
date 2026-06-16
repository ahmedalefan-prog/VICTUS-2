import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "حملاتي الإعلانية" };

export default async function Page() {
  await requirePermission("ads", "VIEW");
  return <ModulePlaceholder title="حملاتي الإعلانية" description="إدارة الحملات الإعلانية" phase="المرحلة 5" />;
}
