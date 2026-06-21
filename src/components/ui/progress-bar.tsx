"use client";

import { useRef, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function ProgressBar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ref = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = `${pathname}${searchParams}`;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.classList.remove("hidden");
    el.style.transform = "translateX(-100%)";
    // Force reflow
    void el.offsetWidth;
    el.style.transition = "transform 0s";
    el.style.transform = "translateX(-90%)";
    // Start the progress
    requestAnimationFrame(() => {
      el.style.transition = "transform 60s linear";
      el.style.transform = "translateX(-10%)";
    });

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      el.style.transition = "transform 0.2s ease";
      el.style.transform = "translateX(0%)";
      setTimeout(() => el.classList.add("hidden"), 300);
    }, 300);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [key]);

  return (
    <div
      ref={ref}
      className="fixed inset-x-0 top-0 z-[100] h-[3px] hidden"
      style={{ transform: "translateX(-100%)" }}
    >
      <div className="h-full w-full bg-gradient-to-l from-primary via-accent to-primary" />
    </div>
  );
}
