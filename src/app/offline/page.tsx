import { Activity, WifiOff } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Ripple } from "@/components/ui/ripple";

export const metadata = { title: "غير متصل" };

// صفحة احتياطية تظهر عند انقطاع الاتصال (يقدّمها Service Worker من الكاش).
export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary text-[var(--primary-fg)]">
        <Activity className="h-7 w-7" strokeWidth={2.5} />
      </span>
      <EmptyState icon={<WifiOff className="h-7 w-7" />} title="لا يوجد اتصال بالإنترنت" description="تعذّر الوصول إلى VICTUS. تحقّق من اتصالك بالشبكة وحاول مجدداً — ستُحمَّل الصفحة تلقائياً عند عودة الاتصال." />
      <Ripple className="inline-flex rounded-lg">
        <a
          href="/dashboard"
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-[var(--primary-fg)] transition-opacity hover:opacity-90"
        >
          إعادة المحاولة
        </a>
      </Ripple>
    </div>
  );
}
