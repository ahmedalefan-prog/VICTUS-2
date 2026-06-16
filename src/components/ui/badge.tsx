import * as React from "react";
import { cn } from "@/lib/utils";

type Tone = "primary" | "success" | "warning" | "danger" | "muted" | "info";

const tones: Record<Tone, string> = {
  primary: "bg-primary-soft text-primary border-primary/30",
  success: "bg-[rgba(34,197,94,0.12)] text-success border-success/30",
  warning: "bg-[rgba(245,181,61,0.12)] text-warning border-warning/30",
  danger: "bg-[rgba(240,82,82,0.12)] text-danger border-danger/30",
  info: "bg-[rgba(56,189,248,0.12)] text-info border-info/30",
  muted: "bg-surface-3 text-fg-muted border-border",
};

export function Badge({
  tone = "muted",
  className,
  ...props
}: { tone?: Tone } & React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

const statusTone: Record<string, Tone> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "danger",
  SUSPENDED: "muted",
};

const statusLabel: Record<string, string> = {
  PENDING: "بانتظار المراجعة",
  APPROVED: "مقبول",
  REJECTED: "مرفوض",
  SUSPENDED: "معلّق",
};

export function StatusBadge({ status }: { status: string }) {
  return <Badge tone={statusTone[status] ?? "muted"}>{statusLabel[status] ?? status}</Badge>;
}
