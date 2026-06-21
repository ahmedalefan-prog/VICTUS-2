"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={cn(
        "fixed bottom-24 left-4 z-40 flex h-10 w-10 items-center justify-center rounded-xl border border-border-soft bg-surface/80 text-fg-muted shadow-lg backdrop-blur-md transition-all duration-300 hover:border-primary/40 hover:text-primary hover:shadow-[0_0_20px_-8px_var(--primary)] active:scale-90 lg:bottom-6",
        visible
          ? "translate-y-0 opacity-100"
          : "translate-y-4 opacity-0 pointer-events-none",
      )}
      aria-label="العودة للأعلى"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
