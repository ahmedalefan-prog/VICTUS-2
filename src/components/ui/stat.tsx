import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  tone?: "primary" | "accent" | "success" | "warning" | "danger";
}) {
  const toneMap = {
    primary: "text-primary bg-primary-soft",
    accent: "text-accent bg-accent-soft",
    success: "text-success bg-[rgba(34,197,94,0.12)]",
    warning: "text-warning bg-[rgba(245,181,61,0.12)]",
    danger: "text-danger bg-[rgba(240,82,82,0.12)]",
  };
  return (
    <div className="card glass flex items-center gap-4 rounded-[var(--radius)] p-5">
      <span className={cn("flex h-12 w-12 items-center justify-center rounded-xl", toneMap[tone])}>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-fg-muted">{label}</p>
        <p className="text-2xl font-bold text-fg">{value}</p>
        {hint && <p className="text-xs text-fg-faint">{hint}</p>}
      </div>
    </div>
  );
}
