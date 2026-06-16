import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "كونسول الخدمة" };

export default async function Page() {
  await requirePermission("services", "VIEW");
  return <ModulePlaceholder title="كونسول الخدمة" description="إدارة كتالوج الخدمة وطلباتها وفريقها وتقاريرها" phase="المرحلة 2" />;
}
