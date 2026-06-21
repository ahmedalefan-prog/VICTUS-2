"use client";

import { useMemo, useState, useTransition, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/order-actions";
import { SERVICE_TYPE_META, CONDITION_META } from "@/lib/services-meta";
import { formatIQD } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Field } from "@/components/ui/input";
import { Package, Plus, Trash2, ShoppingCart, Search, X } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/use-debounce";

export interface ShopItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  condition: string | null;
  priceNormal: number;
  priceVip: number | null;
  unit: string;
  stock: number | null;
}

type Tier = "NORMAL" | "VIP";
interface Line { tier: Tier; qty: number }

export function CatalogShop({
  serviceType,
  items,
  canOrder,
}: {
  serviceType: "LAB" | "MARKET";
  items: ShopItem[];
  canOrder: boolean;
}) {
  const router = useRouter();
  const isLab = serviceType === "LAB";
  const resource = SERVICE_TYPE_META[serviceType].resource;
  const [cart, setCart] = useState<Record<string, Line>>({});
  const [search, setSearch] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const debouncedSearch = useDebounce(search, 200);
  const gridRef = useRef<HTMLDivElement>(null);
  const staggerDone = useRef(false);

  useEffect(() => {
    if (staggerDone.current) return;
    const el = gridRef.current;
    if (el) { el.classList.add("stagger-children"); staggerDone.current = true; }
  }, []);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) => it.name.toLowerCase().includes(q) || it.description.toLowerCase().includes(q),
    );
  }, [items, debouncedSearch]);

  function unitPrice(item: ShopItem, tier: Tier) {
    return tier === "VIP" && item.priceVip !== null ? item.priceVip : item.priceNormal;
  }
  function addToCart(item: ShopItem, tier: Tier) {
    setCart((c) => ({ ...c, [item.id]: { tier, qty: (c[item.id]?.qty ?? 0) + 1 } }));
  }
  function setQty(id: string, qty: number) {
    setCart((c) => {
      if (qty <= 0) { const n = { ...c }; delete n[id]; return n; }
      return { ...c, [id]: { ...c[id], qty } };
    });
  }

  const cartLines = Object.entries(cart).map(([id, l]) => {
    const item = byId.get(id)!;
    const unit = unitPrice(item, l.tier);
    return { id, item, tier: l.tier, qty: l.qty, unit, subtotal: unit * l.qty };
  });
  const listedTotal = cartLines.reduce((s, l) => s + l.subtotal, 0);
  const empty = cartLines.length === 0;

  function submit() {
    setError(null);
    const lines = cartLines.map((l) => ({ catalogItemId: l.id, tier: l.tier, quantity: l.qty }));
    startTransition(async () => {
      try {
        const { id } = await createOrder({ serviceType, note: note || undefined, lines });
        toast({ title: "تم إنشاء الطلب", description: "سيتم معالجته قريباً", variant: "success" });
        router.push(`/${resource}/orders/${id}`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "تعذّر إنشاء الطلب";
        setError(msg);
        toast({ title: "فشل إنشاء الطلب", description: msg, variant: "error" });
      }
    });
  }

  const searchBar = items.length > 5 ? (
    <div className="relative mb-4">
      <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fg-faint" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الكتالوج…"
        className="h-10 pr-10"
      />
      {search && (
        <button onClick={() => setSearch("")} className="absolute left-2 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  ) : null;

  const grid = (
    <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {filtered.map((it) => (
        <Card key={it.id} className="group flex flex-col gap-3 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_0_24px_-8px_var(--primary)]">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-2">
            {it.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
            ) : (
              <div className="flex h-full items-center justify-center text-fg-faint transition-colors group-hover:text-primary"><Package className="h-8 w-8" /></div>
            )}
            {it.condition && CONDITION_META[it.condition] && (
              <div className="absolute left-2 top-2"><Badge tone={CONDITION_META[it.condition].tone}>{CONDITION_META[it.condition].label}</Badge></div>
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-fg transition-colors group-hover:text-primary">{it.name}</p>
              {it.category && <Badge tone="muted">{it.category}</Badge>}
            </div>
            {it.description && <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{it.description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">{formatIQD(it.priceNormal)}{it.unit ? ` / ${it.unit}` : ""}</Badge>
            {isLab && it.priceVip !== null && <Badge tone="primary">VIP: {formatIQD(it.priceVip)}</Badge>}
            {!isLab && it.stock !== null && (
              <Badge tone={it.stock > 0 ? "info" : "danger"}>المخزون: {it.stock} {it.unit}</Badge>
            )}
          </div>
          {canOrder && (
            <div className="mt-auto flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => addToCart(it, "NORMAL")}>
                <Plus className="h-3.5 w-3.5" /> {isLab ? "عادي" : "أضف"}
              </Button>
              {isLab && it.priceVip !== null && (
                <Button size="sm" variant="outline" className="flex-1" onClick={() => addToCart(it, "VIP")}>
                  <Plus className="h-3.5 w-3.5" /> VIP
                </Button>
              )}
            </div>
          )}
        </Card>
      ))}
      {filtered.length === 0 && (
        search ? (
          <EmptyState title="لا توجد نتائج." />
        ) : (
          <EmptyState title="لا توجد عناصر في الكتالوج بعد." />
        )
      )}
    </div>
  );

  if (items.length === 0) {
    return <EmptyState icon={<Package className="h-7 w-7" />} title="لا توجد عناصر في الكتالوج بعد" />;
  }

  if (!canOrder) {
    return (
      <>
        <p className="mb-4 text-sm text-fg-muted">تصفّح فقط — الطلب متاح للأطباء والعيادات.</p>
        {searchBar}
        {grid}
      </>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="lg:col-span-2">{searchBar}{grid}</div>

      <Card className="h-fit lg:sticky lg:top-4">
        <div className="mb-3 flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-fg">طلبك</h3>
          {!empty && <Badge tone="primary">{cartLines.length}</Badge>}
        </div>

        {empty ? (
          <p className="py-6 text-center text-sm text-fg-muted">أضف عناصر من الكتالوج لبدء طلب.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {cartLines.map((l) => (
                <li key={l.id} className="rounded-lg border border-border-soft bg-surface-2/40 p-2.5 transition-all hover:border-primary/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-fg">{l.item.name}</p>
                      <div className="mt-0.5 flex items-center gap-1.5">
                        {isLab && <Badge tone={l.tier === "VIP" ? "primary" : "muted"}>{l.tier === "VIP" ? "VIP" : "عادي"}</Badge>}
                        <span className="text-xs text-fg-muted">{formatIQD(l.unit)}</span>
                      </div>
                    </div>
                    <button onClick={() => setQty(l.id, 0)} className="shrink-0 text-fg-faint hover:text-danger"><Trash2 className="h-4 w-4" /></button>
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

            <Button className="mt-3 w-full transition-all hover:scale-[1.02]" disabled={pending} onClick={() => submit()}>
              {pending ? "جارٍ الإرسال…" : "اطلب بالسعر المعروض"}
            </Button>
          </>
        )}
      </Card>
    </div>
  );
}
