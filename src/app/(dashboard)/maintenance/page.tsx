import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "خدمة الصيانة" };

export default async function Page() {
  await requirePermission("maintenance", "VIEW");
  return <ModulePlaceholder title="خدمة الصيانة" description="طلب صيانة للأطباء والعيادات — خدمة داخلية" phase="المرحلة 4" />;
}
