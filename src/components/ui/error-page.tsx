"use client";

import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
  title?: string;
  description?: string;
}

export function ErrorPage({ error, reset, title, description }: ErrorPageProps) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center p-6 text-center">
      <span className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertTriangle className="h-10 w-10" />
      </span>
      <h1 className="text-2xl font-bold text-fg">{title || "حدث خطأ"}</h1>
      <p className="mt-2 max-w-md text-sm text-fg-muted">
        {description || "عذراً، حدث خطأ غير متوقع. يمكنك المحاولة مرة أخرى أو العودة للوحة التحكم."}
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="mt-2 max-w-xl rounded-lg bg-surface-2/50 p-3 text-left text-xs text-fg-faint font-mono" dir="ltr">
          {error.message}
        </p>
      )}
      <div className="mt-8 flex items-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-6 text-sm font-bold text-[var(--primary-fg)] transition-all hover:bg-primary-strong active:scale-95"
        >
          <RefreshCw className="h-4 w-4" /> إعادة المحاولة
        </button>
        <Link
          href="/dashboard"
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border-soft px-6 text-sm font-medium text-fg transition-all hover:bg-surface-2 active:scale-95"
        >
          <Home className="h-4 w-4" /> العودة للوحة التحكم
        </Link>
      </div>
    </div>
  );
}
