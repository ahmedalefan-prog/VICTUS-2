import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "العيادات" };

export default async function Page() {
  await requirePermission("clinics", "VIEW");
  return <ModulePlaceholder title="العيادات" description="عياداتك ككيان طالب خدمة" phase="المرحلة 5" />;
}
