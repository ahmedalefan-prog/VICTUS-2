import { requirePermission } from "@/lib/guard";
import { ModulePlaceholder } from "@/components/ui/placeholder";

export const metadata = { title: "ملف المرشّح" };

export default async function Page() {
  await requirePermission("candidate", "VIEW");
  return <ModulePlaceholder title="ملف المرشّح" description="مهارات وخبرة وسيرة ذاتية" phase="المرحلة 5" />;
}
