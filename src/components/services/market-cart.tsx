"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/order-actions";
import { CONDITION_META } from "@/lib/services-meta";
import { formatIQD } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { Package, Plus, Trash2, ShoppingCart } from "lucide-react";

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

export function MarketCart({ items, canOrder }: { items: MarketItem[]; canOrder: boolean }) {
  const router = useRouter();
  const [cart, setCart] = useState<Record<string, number>>({});
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const categories = useMemo(() => Array.from(new Set(items.map((i) => i.category).filter(Boolean))), [items]);

  const filtered = items.filter(
    (it) => (!category || it.category === category) && (!condition || it.condition === condition),
  );

  function add(id: string) { setCart((c) => ({ ...c, [id]: (c[id] ?? 0) + 1 })); }
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
        router.push(`/market/orders/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر إنشاء الطلب");
      }
    });
  }

  const filters = (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Select className="h-9 w-40" value={category} onChange={(e) => setCategory(e.target.value)}>
        <option value="">كل الفئات</option>
        {categories.map((c) => <option key={c} value={c}>{c}</option>)}
      </Select>
      <div className="flex items-center gap-1.5">
        <FilterChip label="الكل" active={condition === ""} onClick={() => setCondition("")} />
        {Object.entries(CONDITION_META).map(([k, v]) => (
          <FilterChip key={k} label={v.label} active={condition === k} onClick={() => setCondition(k)} />
        ))}
      </div>
    </div>
  );

  const grid = (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {filtered.map((it) => (
        <Card key={it.id} className="flex flex-col gap-3 p-4">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-2">
            {it.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-fg-faint"><Package className="h-8 w-8" /></div>
            )}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-semibold text-fg">{it.name}</p>
              {it.condition && CONDITION_META[it.condition] && <Badge tone={CONDITION_META[it.condition].tone}>{CONDITION_META[it.condition].label}</Badge>}
              {it.category && <Badge tone="muted">{it.category}</Badge>}
            </div>
            {it.description && <p className="mt-1 line-clamp-2 text-xs text-fg-muted">{it.description}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="muted">{formatIQD(it.priceNormal)}{it.unit ? ` / ${it.unit}` : ""}</Badge>
            {it.stock !== null && <Badge tone={it.stock > 0 ? "info" : "danger"}>المخزون: {it.stock}</Badge>}
          </div>
          {canOrder && (
            <Button size="sm" className="mt-auto" onClick={() => add(it.id)}><Plus className="h-3.5 w-3.5" /> أضف للطلب</Button>
          )}
        </Card>
      ))}
      {filtered.length === 0 && <p className="col-span-full py-8 text-center text-sm text-fg-muted">لا توجد منتجات مطابقة.</p>}
    </div>
  );

  if (items.length === 0) {
    return (
      <Card className="flex flex-col items-center justify-center py-16 text-center">
        <Package className="mb-3 h-10 w-10 text-fg-faint" />
        <p className="font-medium text-fg">لا توجد منتجات في الكتالوج بعد</p>
      </Card>
    );
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
          {!empty && <Badge tone="primary">{cartLines.length}</Badge>}
        </div>

        {empty ? (
          <p className="py-6 text-center text-sm text-fg-muted">أضف منتجات لبدء طلب.</p>
        ) : (
          <>
            <ul className="space-y-2">
              {cartLines.map((l) => (
                <li key={l.id} className="rounded-lg border border-border-soft bg-surface-2/40 p-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-fg">{l.item.name}</p>
                      <span className="text-xs text-fg-muted">{formatIQD(l.item.priceNormal)}</span>
                    </div>
                    <button onClick={() => setQty(l.id, 0)} className="text-fg-faint hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="subtle" className="h-7 w-7 p-0" onClick={() => setQty(l.id, l.qty - 1)}>−</Button>
                      <span className="w-8 text-center text-sm">{l.qty}</span>
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

            <Button className="mt-3 w-full" disabled={pending} onClick={() => submit()}>
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
    <button type="button" onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs ${active ? "border-primary bg-primary-soft text-primary" : "border-border-soft text-fg-muted hover:text-fg"}`}>
      {label}
    </button>
  );
}
