import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "الأدوار والصلاحيات" };

export default async function Page() {
  await requirePermission("roles", "VIEW");
  return <ModulePlaceholder title="الأدوار والصلاحيات" description="مصفوفة الأدوار وتجاوزات الصلاحيات" phase="المرحلة 6" />;
}
