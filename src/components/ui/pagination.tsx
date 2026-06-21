import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  currentPage: number;
  totalPages: number;
  baseHref: string;
}

export function Pagination({ currentPage, totalPages, baseHref }: Props) {
  if (totalPages <= 1) return null;

  function href(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `${baseHref}?${qs}` : baseHref;
  }

  const pages: (number | "...")[] = [];
  for (let i = 1; i <= totalPages; i++) {
    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
      pages.push(i);
    } else if (pages[pages.length - 1] !== "...") {
      pages.push("...");
    }
  }

  return (
    <nav aria-label="التنقل بين الصفحات" className="mt-6 flex items-center justify-center gap-1">
      {currentPage > 1 && (
        <Link
          href={href(currentPage - 1)}
          aria-label="الصفحة السابقة"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-all hover:bg-surface-2 hover:text-fg"
        >
          <ChevronRight className="h-4 w-4" />
        </Link>
      )}
      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="flex h-9 w-9 items-center justify-center text-xs text-fg-faint">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={href(p)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-all",
              p === currentPage
                ? "bg-primary text-[var(--primary-fg)] shadow-[0_0_16px_-4px_var(--primary)]"
                : "text-fg-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            {p}
          </Link>
        ),
      )}
      {currentPage < totalPages && (
        <Link
          href={href(currentPage + 1)}
          aria-label="الصفحة التالية"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-fg-muted transition-all hover:bg-surface-2 hover:text-fg"
        >
          <ChevronLeft className="h-4 w-4" />
        </Link>
      )}
    </nav>
  );
}
