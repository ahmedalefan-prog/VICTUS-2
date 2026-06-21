"use client";

import { useState, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

interface RippleSpan {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleProps {
  children: React.ReactNode;
  className?: string;
  color?: string;
}

export function Ripple({ children, className, color }: RippleProps) {
  const [ripples, setRipples] = useState<RippleSpan[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const size = Math.max(rect.width, rect.height) * 2;
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      const id = idRef.current++;

      setRipples((prev) => [...prev, { id, x, y, size }]);

      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== id));
      }, 600);
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      onClick={handleClick}
      className={cn("relative overflow-hidden", className)}
    >
      {children}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="pointer-events-none absolute rounded-full"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
            background: color ?? "rgba(255,255,255,0.3)",
            animation: "ripple 0.6s ease-out forwards",
          }}
        />
      ))}
    </div>
  );
}
