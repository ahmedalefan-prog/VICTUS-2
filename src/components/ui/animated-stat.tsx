"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface AnimatedStatProps {
  icon: LucideIcon;
  label: string;
  value: number;
  suffix?: string;
  format?: boolean;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  className?: string;
}

export function AnimatedStat({
  icon: Icon,
  label,
  value,
  suffix = "",
  format = true,
  trend,
  trendLabel,
  className,
}: AnimatedStatProps) {
  const [displayed, setDisplayed] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const animated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || animated.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !animated.current) {
          animated.current = true;
          animateValue(0, value, 800, setDisplayed);
        }
      },
      { threshold: 0.3 },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const displayVal = format
    ? new Intl.NumberFormat("ar-IQ").format(displayed)
    : String(displayed);

  const trendColors = {
    up: "text-success",
    down: "text-danger",
    neutral: "text-fg-muted",
  };

  return (
    <div
      ref={ref}
      className={cn(
        "flex items-center gap-4 rounded-xl border border-border-soft bg-surface/40 p-5 transition-all duration-300 hover:border-primary/30 hover:shadow-[0_8px_30px_-12px_var(--primary)]",
        className,
      )}
    >
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-fg-muted">{label}</p>
        <p className="text-2xl font-bold tabular-nums text-fg">
          {displayVal}
          {suffix}
        </p>
        {trend && trendLabel && (
          <p className={cn("mt-0.5 text-xs", trendColors[trend])}>{trendLabel}</p>
        )}
      </div>
    </div>
  );
}

function animateValue(
  start: number,
  end: number,
  duration: number,
  set: (v: number) => void,
) {
  const diff = end - start;
  const startTime = performance.now();

  function tick(now: number) {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - (1 - progress) * (1 - progress); // ease-out quad
    set(Math.round(start + diff * eased));
    if (progress < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
