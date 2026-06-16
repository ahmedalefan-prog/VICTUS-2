import Link from "next/link";
import { Activity } from "lucide-react";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <Link href="/" className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-[#04211f] shadow-[0_8px_24px_-8px_var(--primary)]">
          <Activity className="h-6 w-6" strokeWidth={2.5} />
        </span>
        <span className="text-2xl font-bold tracking-tight text-fg">VICTUS</span>
      </Link>
      <div className="w-full max-w-md animate-fade-in">{children}</div>
      <p className="mt-8 text-xs text-fg-faint">
        منصة قطاع طب الأسنان في العراق · العملة: دينار عراقي IQD
      </p>
    </div>
  );
}
