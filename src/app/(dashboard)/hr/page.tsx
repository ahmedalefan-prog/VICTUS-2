import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "الموارد البشرية" };

export default async function Page() {
  await requirePermission("hr", "VIEW");
  return <ModulePlaceholder title="الموارد البشرية" description="موظفون وحضور وإجازات ورواتب لفِرَق الخدمات" phase="المرحلة 5" />;
}
