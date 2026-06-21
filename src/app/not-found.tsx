import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg p-6 text-center">
      <span className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary-soft text-primary">
        <FileQuestion className="h-12 w-12" />
      </span>
      <h1 className="text-4xl font-bold text-fg">404</h1>
      <p className="mt-2 text-lg text-fg-muted">الصفحة غير موجودة</p>
      <p className="mt-1 max-w-sm text-sm text-fg-faint">
        الصفحة التي تبحث عنها قد تكون أُزيلت أو الرابط غير صحيح.
      </p>
      <Link
        href="/dashboard"
        className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-[var(--primary-fg)] transition-all hover:bg-primary-strong active:scale-95"
      >
        العودة للوحة التحكم
      </Link>
    </div>
  );
}
