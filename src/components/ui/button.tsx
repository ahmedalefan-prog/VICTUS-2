"use client";

import * as React from "react";
import { useState, useRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] disabled:opacity-50 disabled:pointer-events-none select-none group",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-[var(--primary-fg)] hover:bg-primary-strong shadow-[0_8px_24px_-10px_var(--primary)] hover:shadow-[0_0_0_1px_rgba(22,196,184,0.3),0_0_30px_-6px_var(--primary),0_0_60px_-20px_var(--accent)]",
        accent: "bg-accent text-white hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(59,130,246,0.3),0_0_24px_-8px_var(--accent)]",
        outline:
          "border border-border bg-transparent text-fg hover:bg-surface-2 hover:border-primary/30 hover:shadow-[0_0_24px_-12px_var(--primary)]",
        ghost: "bg-transparent text-fg-muted hover:bg-surface-2 hover:text-fg",
        danger: "bg-danger text-white hover:brightness-110 hover:shadow-[0_0_0_1px_rgba(240,82,82,0.3),0_0_24px_-8px_var(--danger)]",
        subtle: "bg-surface-2 text-fg hover:bg-surface-3",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-5",
        lg: "h-12 px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

interface RippleSpan {
  id: number;
  x: number;
  y: number;
  size: number;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, children, onClick, ...props }, ref) => {
    const [ripples, setRipples] = useState<RippleSpan[]>([]);
    const idRef = useRef(0);
    const btnRef = useRef<HTMLButtonElement>(null);

    const mergedRef = (el: HTMLButtonElement | null) => {
      btnRef.current = el;
      if (typeof ref === "function") ref(el);
      else if (ref) ref.current = el;
    };

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = btnRef.current?.getBoundingClientRect();
      if (rect) {
        const size = Math.max(rect.width, rect.height) * 2;
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        const id = idRef.current++;
        setRipples((prev) => [...prev, { id, x, y, size }]);
        setTimeout(() => {
          setRipples((prev) => prev.filter((r) => r.id !== id));
        }, 600);
      }
      onClick?.(e);
    };

    return (
      <button
        ref={mergedRef}
        className={cn(
          buttonVariants({ variant, size }),
          "relative overflow-hidden",
          className,
        )}
        onClick={handleClick}
        {...props}
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
              background: "rgba(255,255,255,0.3)",
              animation: "ripple 0.6s ease-out forwards",
            }}
          />
        ))}
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
