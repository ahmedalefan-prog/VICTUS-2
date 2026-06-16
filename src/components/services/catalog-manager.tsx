"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCatalogItem, deleteCatalogItem, toggleCatalogItemActive } from "@/lib/catalog-actions";
import { CONDITION_META } from "@/lib/services-meta";
import { formatIQD } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Textarea, Field } from "@/components/ui/input";
import { Plus, Pencil, Trash2 } from "lucide-react";

export interface CatalogItemData {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  category: string;
  condition: string;
  priceNormal: number;
  priceVip: number | null;
  unit: string;
  stock: number | null;
  bulkThreshold: number | null;
  isActive: boolean;
}

export function CatalogManager({ serviceType, items }: { serviceType: string; items: CatalogItemData[] }) {
  const isLab = serviceType === "LAB";
  const isMarket = serviceType === "MARKET";
  const [editing, setEditing] = useState<CatalogItemData | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> إضافة عنصر
          </Button>
        </div>
        {items.length === 0 ? (
          <Card className="py-12 text-center text-fg-muted">لا توجد عناصر بعد — أضف أول عنصر.</Card>
        ) : (
          items.map((it) => (
            <ItemRow key={it.id} item={it} isLab={isLab} isMarket={isMarket} onEdit={() => { setEditing(it); setShowForm(true); }} />
          ))
        )}
      </div>

      {showForm && (
        <ItemForm key={editing?.id ?? "new"} item={editing} isLab={isLab} isMarket={isMarket} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function ItemRow({ item, isLab, isMarket, onEdit }: { item: CatalogItemData; isLab: boolean; isMarket: boolean; onEdit: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Card className={`flex flex-wrap items-center justify-between gap-3 ${item.isActive ? "" : "opacity-60"}`}>
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-fg">{item.name}</p>
          {item.condition && CONDITION_META[item.condition] && <Badge tone={CONDITION_META[item.condition].tone}>{CONDITION_META[item.condition].label}</Badge>}
          {!item.isActive && <Badge tone="muted">مخفي</Badge>}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge tone="muted">عادي: {formatIQD(item.priceNormal)}</Badge>
          {isLab && item.priceVip !== null && <Badge tone="primary">VIP: {formatIQD(item.priceVip)}</Badge>}
          {isMarket && item.stock !== null && <Badge tone="info">المخزون: {item.stock} {item.unit}</Badge>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="ghost" disabled={pending}
          onClick={() => startTransition(async () => { await toggleCatalogItemActive(item.id, !item.isActive); router.refresh(); })}>
          {item.isActive ? "إخفاء" : "إظهار"}
        </Button>
        <Button size="sm" variant="danger" disabled={pending}
          onClick={() => { if (!confirm(`حذف «${item.name}»؟`)) return; startTransition(async () => { await deleteCatalogItem(item.id); router.refresh(); }); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function ItemForm({ item, isLab, isMarket, onClose }: { item: CatalogItemData | null; isLab: boolean; isMarket: boolean; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="h-fit lg:sticky lg:top-4">
      <h3 className="mb-4 font-semibold text-fg">{item ? "تعديل عنصر" : "عنصر جديد"}</h3>
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            try {
              await saveCatalogItem(fd);
              router.refresh();
              onClose();
            } catch (e) {
              setError(e instanceof Error ? e.message : "تعذّر الحفظ");
            }
          })
        }
        className="space-y-3"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        {item && <input type="hidden" name="id" value={item.id} />}
        <Field label="الاسم"><Input name="name" required defaultValue={item?.name ?? ""} /></Field>
        <Field label="الوصف"><Textarea name="description" defaultValue={item?.description ?? ""} /></Field>
        <Field label="رابط الصورة"><Input name="imageUrl" dir="ltr" defaultValue={item?.imageUrl ?? ""} placeholder="https://…" /></Field>
        <Field label="السعر العادي (IQD)">
          <Input name="priceNormal" type="number" min="0" step="any" required defaultValue={item?.priceNormal ?? ""} dir="ltr" />
        </Field>
        {isLab && (
          <Field label="سعر VIP (IQD)" hint="اختياري">
            <Input name="priceVip" type="number" min="0" step="any" defaultValue={item?.priceVip ?? ""} dir="ltr" />
          </Field>
        )}
        <Field label="الوحدة" hint="مثال: سن / قطعة"><Input name="unit" defaultValue={item?.unit ?? ""} /></Field>
        {isMarket && (
          <>
            <Field label="الفئة"><Input name="category" defaultValue={item?.category ?? ""} /></Field>
            <Field label="الحالة">
              <Select name="condition" defaultValue={item?.condition ?? ""}>
                <option value="">— غير محدّد —</option>
                {Object.entries(CONDITION_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </Field>
            <Field label="المخزون" hint="اختياري">
              <Input name="stock" type="number" min="0" step="any" defaultValue={item?.stock ?? ""} dir="ltr" />
            </Field>
            <Field label="حدّ كمية الجملة" hint="عند بلوغها يُتاح التفاوض (فارغ = بلا تفاوض)">
              <Input name="bulkThreshold" type="number" min="1" step="1" defaultValue={item?.bulkThreshold ?? ""} dir="ltr" />
            </Field>
          </>
        )}
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={pending}>{pending ? "جارٍ الحفظ…" : "حفظ"}</Button>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </div>
      </form>
    </Card>
  );
}
