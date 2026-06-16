import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "إعدادات النظام" };

export default async function Page() {
  await requirePermission("settings", "VIEW");
  return <ModulePlaceholder title="إعدادات النظام" description="إعدادات المنصة" phase="المرحلة 6" />;
}
