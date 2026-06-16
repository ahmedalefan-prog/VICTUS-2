import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "المستخدمون" };

export default async function Page() {
  await requirePermission("users", "VIEW");
  return <ModulePlaceholder title="المستخدمون" description="إدارة حسابات المنصة" phase="المرحلة 6" />;
}
