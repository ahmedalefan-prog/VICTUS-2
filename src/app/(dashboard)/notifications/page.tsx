import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "الإشعارات" };

export default async function Page() {
  await requirePermission("notifications", "VIEW");
  return <ModulePlaceholder title="الإشعارات" description="إشعاراتك على المنصة" phase="المرحلة 1" />;
}
