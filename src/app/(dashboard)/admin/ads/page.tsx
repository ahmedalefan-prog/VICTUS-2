import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "مراجعة الإعلانات" };

export default async function Page() {
  await requirePermission("ads", "MANAGE");
  return <ModulePlaceholder title="مراجعة الإعلانات" description="اعتماد الحملات الإعلانية" phase="المرحلة 5" />;
}
