"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveBrand, toggleBrandActive, deleteBrand } from "@/lib/brand-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Plus, Pencil, Trash2, Tags } from "lucide-react";

export interface BrandData {
  id: string;
  name: string;
  category: string;
  country: string;
  website: string;
  logoUrl: string;
  about: string;
  isActive: boolean;
}

export function BrandManager({ brands }: { brands: BrandData[] }) {
  const [editing, setEditing] = useState<BrandData | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}><Plus className="h-4 w-4" /> إضافة علامة</Button>
        </div>
        {brands.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-12 text-center">
            <Tags className="mb-3 h-9 w-9 text-fg-faint" />
            <p className="font-medium text-fg">لا توجد علامات بعد</p>
          </Card>
        ) : (
          brands.map((b) => <BrandRow key={b.id} brand={b} onEdit={() => { setEditing(b); setShowForm(true); }} />)
        )}
      </div>

      {showForm && <BrandForm key={editing?.id ?? "new"} brand={editing} onClose={() => setShowForm(false)} />}
    </div>
  );
}

function BrandRow({ brand, onEdit }: { brand: BrandData; onEdit: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <Card className={`flex flex-wrap items-center justify-between gap-3 ${brand.isActive ? "" : "opacity-60"}`}>
      <div className="flex items-center gap-3">
        {brand.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- external brand logos
          <img src={brand.logoUrl} alt={brand.name} className="h-10 w-10 rounded-lg object-contain bg-surface-2" />
        ) : (
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-2 text-fg-faint"><Tags className="h-4 w-4" /></span>
        )}
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-fg">{brand.name}</p>
            {!brand.isActive && <Badge tone="muted">مخفية</Badge>}
          </div>
          <p className="text-xs text-fg-muted">{[brand.category, brand.country].filter(Boolean).join(" · ") || "—"}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
        <Button size="sm" variant="ghost" disabled={pending}
          onClick={() => startTransition(async () => { await toggleBrandActive(brand.id, !brand.isActive); router.refresh(); })}>
          {brand.isActive ? "إخفاء" : "إظهار"}
        </Button>
        <Button size="sm" variant="danger" disabled={pending}
          onClick={() => { if (!confirm(`حذف «${brand.name}»؟`)) return; startTransition(async () => { await deleteBrand(brand.id); router.refresh(); }); }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </Card>
  );
}

function BrandForm({ brand, onClose }: { brand: BrandData | null; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="h-fit lg:sticky lg:top-4">
      <h3 className="mb-4 font-semibold text-fg">{brand ? "تعديل علامة" : "علامة جديدة"}</h3>
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            try { await saveBrand(fd); router.refresh(); onClose(); }
            catch (e) { setError(e instanceof Error ? e.message : "تعذّر الحفظ"); }
          })
        }
        className="space-y-3"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        {brand && <input type="hidden" name="id" value={brand.id} />}
        <Field label="الاسم"><Input name="name" required defaultValue={brand?.name ?? ""} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="الفئة"><Input name="category" defaultValue={brand?.category ?? ""} /></Field>
          <Field label="البلد"><Input name="country" defaultValue={brand?.country ?? ""} /></Field>
        </div>
        <Field label="الموقع"><Input name="website" dir="ltr" defaultValue={brand?.website ?? ""} placeholder="https://…" /></Field>
        <Field label="رابط الشعار"><Input name="logoUrl" dir="ltr" defaultValue={brand?.logoUrl ?? ""} placeholder="https://…" /></Field>
        <Field label="نبذة"><Textarea name="about" defaultValue={brand?.about ?? ""} className="min-h-16" /></Field>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={pending}>{pending ? "جارٍ الحفظ…" : "حفظ"}</Button>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </div>
      </form>
    </Card>
  );
}
