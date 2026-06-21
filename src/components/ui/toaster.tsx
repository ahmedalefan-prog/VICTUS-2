"use client";

import { useToast } from "@/hooks/use-toast";
import { X, CheckCircle, AlertTriangle, Info, XCircle } from "lucide-react";

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
};

const STYLES: Record<string, string> = {
  success: "border-success/30 bg-[rgba(34,197,94,0.1)]",
  error: "border-danger/30 bg-[rgba(240,82,82,0.1)]",
  warning: "border-warning/30 bg-[rgba(245,181,61,0.1)]",
  info: "border-info/30 bg-[rgba(56,189,248,0.1)]",
};

const ICON_COLORS: Record<string, string> = {
  success: "text-success",
  error: "text-danger",
  warning: "text-warning",
  info: "text-info",
};

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none sm:top-6"
    >
      {toasts.map((t) => {
        const Icon = ICONS[t.variant];
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-[0_12px_40px_-12px_rgba(0,0,0,0.6)] backdrop-blur-xl ${STYLES[t.variant]}`}
            style={{ animation: "slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both" }}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${ICON_COLORS[t.variant]}`} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-fg">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 text-xs text-fg-muted">{t.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-fg-faint hover:text-fg transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      <style jsx global>{`
        @keyframes slideIn {
          from { opacity: 0; transform: translateY(-20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
