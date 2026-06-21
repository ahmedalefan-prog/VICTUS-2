"use client";

import { useMemo, useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/order-actions";
import { CONDITION_META } from "@/lib/services-meta";
import { formatIQD } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Select, Field } from "@/components/ui/input";
import { Package, Plus, Trash2, ShoppingCart, Search, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export interface MarketItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  condition: string | null;
  priceNormal: number;
  unit: string;
  stock: number | null;
}

function StockBar({ stock }: { stock: number }) {
  const level = stock > 50 ? "high" : stock > 10 ? "med" : "low";
  const pct = Math.min(stock, 100);
  return (
    <div className="h-1 w-full rounded-full bg-surface-2">
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500",
          level === "high" && "bg-primary",
          level === "med" && "bg-warning",
          level === "low" && "bg-danger",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function MarketCart({ items, canOrder }: { items: MarketItem[]; canOrder: boolean }) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [animId, setAnimId] = useState(0);
  const debouncedSearch = useDebounce(search, 200);
  const gridRef = useRef<HTMLDivElement>(null);
  const staggerDone = useRef(false);

  useEffect(() => {
    if (staggerDone.current) return;
    const el = gridRef.current;
    if (el) {
      el.classList.add("stagger-children");
      staggerDone.current = true;
    }
  }, []);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category).filter(Boolean))), [items]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return items.filter(
      (it) =>
        (!category || it.category === category) &&
        (!condition || it.condition === condition) &&
        (!q || it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q)),
    );
  }, [items, category, condition, debouncedSearch]);

  const categoriesInFilter = useMemo(
    () => Array.from(new Set(filtered.map((i) => i.category).filter(Boolean))),
    [filtered],
  );

  function add(id: string) {
    setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 }));
    setAnimId((a) => a + 1);
  }
  function setQty(id: string, qty: number) {
    setCart((c) => {
      if (qty <= 0) { const n = { ...c }; delete n[id]; return n; }
      return { ...c, [id]: qty };
    });
  }

  const cartLines = Object.entries(cart).map(([id, qty]) => {
    const item = byId.get(id)!;
    return { id, item, qty, subtotal: item.priceNormal * qty };
  });
  const listedTotal = cartLines.reduce((s, l) => s + l.subtotal, 0);
  const empty = cartLines.length === 0;

  function submit() {
    setError(null);
    const lines = cartLines.map((l) => ({ catalogItemId: l.id, tier: "NORMAL" as const, quantity: l.qty }));
    startTransition(async () => {
      try {
        const { id } = await createOrder({ serviceType: "MARKET", note: note || undefined, lines });
        toast({ title: "تم إنشاء الطلب", description: "سيتم معالجته من فريق السوق", variant: "success" });
        router.push(`/market/orders/${id}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "تعذّر إنشاء الطلب";
        setError(msg);
        toast({ title: "فشل إنشاء الطلب", description: msg, variant: "error" });
      }
    });
  }

  function clearFilters() {
    setCategory("");
    setCondition("");
    setSearch("");
  }

  const hasFilters = category || condition || search;
  const resultCount = filtered.length;
  const totalCount = items.length;

  const filters = (
    <div className="mb-4 space-y-3">
      <div className="relative">
        <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن منتج…"
          className="h-10 pr-10"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="absolute left-2 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select className="h-9 w-40" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">كل الفئات</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c} {categoriesInFilter.includes(c) || !hasFilters ? "" : `(${items.filter(i => i.category === c).length})`}</option>
          ))}
        </Select>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          <FilterChip label="الكل" active={condition === ""} onClick={() => setCondition("")} />
          {Object.entries(CONDITION_META).map(([k, v]) => (
            <FilterChip key={k} label={v.label} active={condition === k} onClick={() => setCondition(k)} />
          ))}
        </div>

        {hasFilters && (
          <button onClick={clearFilters} className="text-xs text-fg-faint hover:text-primary transition-colors">
            مسح الكل
          </button>
        )}
      </div>

      {hasFilters && (
        <p className="text-xs text-fg-muted">
          {resultCount} من أصل {totalCount} منتج
        </p>
      )}
    </div>
  );

  const grid = (
    <div
      ref={gridRef}
      className="grid grid-cols-1 gap-4 sm:grid-cols-2"
    >
      {filtered.map((it) => (
        <Card
          key={it.id}
          className="group flex flex-col gap-3 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_0_24px_-8px_var(--primary)]"
        >
          <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-2">
            {it.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={it.imageUrl}
                alt={it.name}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-fg-faint transition-colors group-hover:text-primary">
                <Package className="h-8 w-8" />
              </div>
            )}
            {it.condition && CONDITION_META[it.condition] && (
              <div className="absolute left-2 top-2">
                <Badge tone={CONDITION_META[it.condition].tone}>{CONDITION_META[it.condition].label}</Badge>
              </div>
            )}
          </div>

          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-fg transition-colors group-hover:text-primary">{it.name}</p>
              {it.category && <Badge tone="muted">{it.category}</Badge>}
            </div>
            {it.description && (
              <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{it.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Badge tone="muted" className="text-sm">
                {formatIQD(it.priceNormal)}{it.unit ? ` / ${it.unit}` : ""}
              </Badge>
              {it.stock !== null && (
                <Badge tone={it.stock > 0 ? "info" : "danger"} className="text-xs">
                  المخزون: {it.stock}
                </Badge>
              )}
            </div>
            {it.stock !== null && it.stock > 0 && <StockBar stock={it.stock} />}
          </div>

          {canOrder && (
            <Button
              size="sm"
              className="mt-auto w-full transition-all duration-200 hover:scale-[1.02]"
              onClick={() => add(it.id)}
              disabled={it.stock !== null && it.stock <= 0}
            >
              <Plus className="h-3.5 w-3.5" />
              {it.stock !== null && it.stock <= 0 ? "نفد المخزون" : "أضف للطلب"}
            </Button>
          )}
        </Card>
      ))}
      {filtered.length === 0 && (
        hasFilters ? (
          <EmptyState title="لا توجد منتجات تطابق بحثك." />
        ) : (
          <EmptyState title="لا توجد منتجات متاحة." />
        )
      )}
    </div>
  );

  if (items.length === 0) {
    return <EmptyState icon={<Package className="h-7 w-7" />} title="لا توجد منتجات في الكتالوج بعد" />;
  }

  if (!canOrder) {
    return (
      <>
        <p className="mb-4 text-sm text-fg-muted">تصفّح فقط — الطلب متاح للأطباء والعيادات.</p>
        {filters}
        {grid}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">{filters}{grid}</div>

      <Card className="h-fit lg:sticky lg:top-4">
        <div className="mb-3 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-fg">طلبك</h3>
          {!empty && (
            <Badge tone="primary" key={animId} className="transition-all duration-200">
              {cartLines.length}
            </Badge>
          )}
        </div>

        {empty ? (
          <p className="py-6 text-center text-sm text-fg-muted">أضف منتجات لبدء طلب.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {cartLines.map((l) => (
                <li
                  key={l.id}
                  className="rounded-lg border border-border-soft bg-surface-2/40 p-2.5 transition-all duration-200 hover:border-primary/30"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{l.item.name}</p>
                      <span className="text-xs text-fg-muted">{formatIQD(l.item.priceNormal)}</span>
                    </div>
                    <button onClick={() => setQty(l.id, 0)} className="shrink-0 text-fg-faint transition-colors hover:text-danger">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="subtle" className="h-7 w-7 p-0" onClick={() => setQty(l.id, l.qty - 1)}>−</Button>
                      <span className="w-8 text-center text-sm tabular-nums">{l.qty}</span>
                      <Button size="sm" variant="subtle" className="h-7 w-7 p-0" onClick={() => setQty(l.id, l.qty + 1)}>+</Button>
                    </div>
                    <span className="text-sm font-medium text-fg">{formatIQD(l.subtotal)}</span>
                  </div>
                </li>
              ))}
            </ul>

            <div className="my-3 flex items-center justify-between border-t border-border-soft pt-3">
              <span className="text-sm text-fg-muted">الإجمالي المعروض</span>
              <span className="font-bold text-fg">{formatIQD(listedTotal)}</span>
            </div>

            <Field label="ملاحظة (اختياري)">
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="تفاصيل إضافية…" />
            </Field>

            {error && <p className="mt-2 text-sm text-danger">{error}</p>}

            <Button className="mt-3 w-full transition-all duration-200 hover:scale-[1.02]" disabled={pending} onClick={() => submit()}>
              {pending ? "جارٍ الإرسال…" : "اطلب بالسعر المعروض"}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-3 py-1 text-xs transition-all duration-200",
        active
          ? "border-primary bg-primary-soft text-primary"
          : "border-border-soft text-fg-muted hover:border-primary/40 hover:text-fg",
      )}
    >
      {label}
    </button>
  );
}
