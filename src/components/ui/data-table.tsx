"use client";

import { useState, useMemo, type ReactNode } from "react";
import { ChevronDown, ChevronUp, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { useDebounce } from "@/hooks/use-debounce";

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  cellClass?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  emptyMessage?: string;
  pageSize?: number;
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  searchable = false,
  searchPlaceholder = "بحث...",
  emptyMessage = "لا توجد بيانات",
  pageSize = 20,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const debouncedSearch = useDebounce(search, 200);

  const filtered = useMemo(() => {
    let items = data;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      items = items.filter((row) =>
        columns.some((col) => {
          const val = col.render(row);
          return String(val ?? "").toLowerCase().includes(q);
        }),
      );
    }
    if (sortKey) {
      items = [...items].sort((a, b) => {
        const va = String(columns.find((c) => c.key === sortKey)?.render(a) ?? "");
        const vb = String(columns.find((c) => c.key === sortKey)?.render(b) ?? "");
        return sortDir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
      });
    }
    return items;
  }, [data, debouncedSearch, sortKey, sortDir, columns]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paged = filtered.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  }

  return (
    <div className="space-y-3">
      {searchable && (
        <div className="relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            placeholder={searchPlaceholder}
            className="futuristic-input h-10 pr-9"
          />
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border-soft/60 bg-surface/30 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_30px_-16px_var(--primary)]">
        <div className="overflow-x-auto">
          <table className="futuristic-table w-full text-sm">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={cn(
                      col.sortable && "cursor-pointer select-none hover:text-fg transition-colors",
                    )}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.sortable && (
                        sortKey === col.key ? (
                          sortDir === "asc" ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
                        )
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 ? (
                <tr>
                  <td colSpan={columns.length}>
                    <EmptyState title={emptyMessage} />
                  </td>
                </tr>
              ) : (
                paged.map((row) => (
                  <tr key={keyExtractor(row)}>
                    {columns.map((col) => (
                      <td key={col.key} className={cn(col.cellClass)}>
                        {col.render(row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2 text-xs text-fg-muted">
          <span>
            صفحة {page + 1} من {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="rounded-lg border border-border-soft px-3 py-1.5 transition-all hover:border-primary/30 hover:text-fg disabled:opacity-40"
            >
              السابق
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              className="rounded-lg border border-border-soft px-3 py-1.5 transition-all hover:border-primary/30 hover:text-fg disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
