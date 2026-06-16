import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "المحافظات" };

export default async function Page() {
  await requirePermission("governorates", "VIEW");
  return <ModulePlaceholder title="المحافظات" description="إدارة المحافظات والمناطق" phase="المرحلة 6" />;
}
