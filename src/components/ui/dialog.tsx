"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  closeOnOverlay?: boolean;
}

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
  closeOnOverlay = true,
}: DialogProps) {
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  useEffect(() => {
    if (open && contentRef.current) {
      const first = contentRef.current.querySelector<HTMLElement>(
        "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
      );
      first?.focus();
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={closeOnOverlay ? onClose : undefined}
      />
      <div className="relative z-10">
        <div
          ref={contentRef}
          className={cn(
            "relative w-full max-w-lg rounded-2xl border border-border-soft/60 bg-bg-soft/95 p-6 shadow-[0_0_40px_-16px_var(--primary),0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl",
            className,
          )}
          style={{ animation: "scaleIn 0.2s ease both" }}
        >
          {title && (
            <div className="mb-1 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-fg">{title}</h2>
                {description && (
                  <p className="mt-1 text-sm text-fg-muted">{description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="إغلاق"
                className="shrink-0 rounded-lg p-1.5 text-fg-faint hover:bg-surface-2 hover:text-fg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          )}
          {children}
        </div>
      </div>
      <style jsx global>{`
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95) translateY(8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "تأكيد الإجراء",
  description = "هل أنت متأكد من رغبتك في إكمال هذا الإجراء؟",
  confirmLabel = "تأكيد",
  cancelLabel = "إلغاء",
  variant = "danger",
  loading = false,
  children,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "primary";
  loading?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <Dialog open={open} onClose={onClose} title={title} description={description}>
      {children}
      <div className="mt-6 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="inline-flex h-10 items-center justify-center rounded-lg border border-border bg-transparent px-4 text-sm font-medium text-fg-muted hover:bg-surface-2 hover:text-fg transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-bold text-white transition-all disabled:opacity-50 ${
            variant === "danger"
              ? "bg-danger hover:brightness-110"
              : "bg-primary text-[var(--primary-fg)] hover:bg-primary-strong"
          }`}
        >
          {loading ? "جارٍ..." : confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
