import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-surface-3/60",
        className,
      )}
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 rounded-xl border border-border-soft bg-surface p-4">
      <Skeleton className="h-40 w-full rounded-lg" />
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full rounded-lg" />
    </div>
  );
}

export function SkeletonRow({ cells = 4 }: { cells?: number }) {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-border-soft/50 last:border-0">
      {Array.from({ length: cells }).map((_, i) => (
        <div key={i} className="h-5 flex-1 rounded-md animate-shimmer" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-border-soft bg-surface p-1">
      <div className="flex gap-4 border-b border-border-soft px-4 py-3">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 flex-1 rounded-md animate-shimmer opacity-60" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cells={cols} />
      ))}
    </div>
  );
}
