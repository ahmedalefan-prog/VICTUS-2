import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "الأجهزة" };

export default async function Page() {
  await requirePermission("devices", "VIEW");
  return <ModulePlaceholder title="الأجهزة" description="أجهزة العيادة (للصيانة والتوافق)" phase="المرحلة 5" />;
}
