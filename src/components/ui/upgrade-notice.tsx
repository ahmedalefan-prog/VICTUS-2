import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Ripple } from "@/components/ui/ripple";

// إشعار ترقية لطيف يظهر بدل المحتوى عندما لا تفتح باقة المستخدم الميزة.
export function UpgradeNotice({ feature }: { feature: string }) {
  return (
    <Card className="flex flex-col items-center justify-center py-16 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Lock className="h-6 w-6" />
      </span>
      <p className="font-semibold text-fg">ميزة «{feature}» متاحة في باقة أعلى</p>
      <p className="mt-1 max-w-md text-sm text-fg-muted">رقِّ باقتك لفتح هذه الميزة وكامل قدرات المنصة.</p>
      <Ripple className="inline-flex rounded-lg">
        <Link href="/account/subscription" className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90">
          عرض الباقات والترقية
        </Link>
      </Ripple>
    </Card>
  );
}
