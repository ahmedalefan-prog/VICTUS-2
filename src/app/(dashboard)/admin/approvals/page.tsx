import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "مراجعة الحسابات" };

export default async function Page() {
  await requirePermission("approvals", "VIEW");
  return <ModulePlaceholder title="مراجعة الحسابات" description="الموافقة على الحسابات الجديدة" phase="المرحلة 6" />;
}
