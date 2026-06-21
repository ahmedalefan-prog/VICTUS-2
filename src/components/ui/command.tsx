"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Command, ArrowLeft, X } from "lucide-react";
import { useHotkey } from "@/hooks/use-hotkey";
import { cn } from "@/lib/utils";

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  href: string;
  icon?: React.ReactNode;
  keywords?: string[];
}

interface CommandPaletteProps {
  items: CommandItem[];
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ items, open, onClose }: CommandPaletteProps) {
  if (!open) return null;
  return <CommandPaletteInner key="cmd" items={items} open={open} onClose={onClose} />;
}

function CommandPaletteInner({ items, open, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  const filtered = items.filter((item) => {
    const q = query.toLowerCase();
    if (!q) return true;
    return (
      item.label.toLowerCase().includes(q) ||
      item.description?.toLowerCase().includes(q) ||
      item.keywords?.some((k) => k.includes(q))
    );
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const navigate = useCallback(
    (href: string) => {
      router.push(href);
      onClose();
    },
    [router, onClose],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && filtered[selectedIndex]) {
      navigate(filtered[selectedIndex].href);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  useHotkey({ key: "k", modifiers: ["meta"] }, onClose, open);
  useHotkey({ key: "k", modifiers: ["ctrl"] }, onClose, open);

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center pt-[15vh]">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-xl rounded-2xl border border-border-soft bg-bg-soft/95 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl overflow-hidden"
        style={{ animation: "scaleIn 0.15s ease both" }}
      >
        <div className="flex items-center gap-3 border-b border-border-soft px-4">
          <Search className="h-5 w-5 shrink-0 text-fg-faint" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0); }}
            onKeyDown={handleKeyDown}
            placeholder="ابحث في المنصة..."
            className="h-14 w-full bg-transparent text-base text-fg placeholder:text-fg-faint focus:outline-none"
            dir="auto"
          />
          {query && (
            <button type="button" onClick={() => { setQuery(""); setSelectedIndex(0); }} className="text-fg-faint hover:text-fg">
              <X className="h-4 w-4" />
            </button>
          )}
          <kbd className="hidden shrink-0 items-center gap-1 rounded-md border border-border-soft bg-surface-2 px-2 py-1 text-[11px] text-fg-faint sm:flex">
            <Command className="h-3 w-3" />K
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-fg-muted">
              لا نتائج لـ «{query}»
            </div>
          ) : (
            filtered.map((item, i) => (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.href)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-right transition-colors",
                  i === selectedIndex
                    ? "bg-primary-soft text-primary"
                    : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                )}
              >
                {item.icon && (
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface-2 text-inherit">
                    {item.icon}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-fg">{item.label}</p>
                  {item.description && (
                    <p className="text-xs text-fg-muted">{item.description}</p>
                  )}
                </div>
                <ArrowLeft className="h-4 w-4 shrink-0 opacity-0 group-hover:opacity-100" />
              </button>
            ))
          )}
        </div>

        <div className="flex items-center gap-4 border-t border-border-soft px-4 py-2.5 text-[11px] text-fg-faint">
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border-soft bg-surface-2 px-1.5 py-0.5 text-[10px]">↑↓</kbd>
             التنقل
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border-soft bg-surface-2 px-1.5 py-0.5 text-[10px]">↵</kbd>
             فتح
          </span>
          <span className="flex items-center gap-1">
            <kbd className="rounded border border-border-soft bg-surface-2 px-1.5 py-0.5 text-[10px]">Esc</kbd>
             إغلاق
          </span>
        </div>
      </div>
    </div>
  );
}
