"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createOrder } from "@/lib/order-actions";
import { formatIQD } from "@/lib/format";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Field } from "@/components/ui/input";
import { Odontogram, ALL_FDI } from "@/components/services/odontogram";
import { Package, Plus, Trash2, X } from "lucide-react";

export interface LabCatalogItem {
  id: string;
  name: string;
  description: string;
  imageUrl: string;
  priceNormal: number;
  priceVip: number | null;
}

// Distinct colours assigned to order items (one tooth → one item → one colour).
const PALETTE = ["#2dd4bf", "#f59e0b", "#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fb923c", "#e879f9"];

interface Line {
  key: string;
  catalogItemId: string;
  name: string;
  priceNormal: number;
  priceVip: number | null;
  tier: "NORMAL" | "VIP";
  shade: string;
  itemNotes: string;
  teeth: number[];
}

let uid = 0;

export function LabOrderBuilder({ items }: { items: LabCatalogItem[] }) {
  const router = useRouter();
  const [lines, setLines] = useState<Line[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [caseFiles, setCaseFiles] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const teethInputRef = useRef<HTMLInputElement>(null);

  const colorOf = (key: string) => PALETTE[lines.findIndex((l) => l.key === key) % PALETTE.length];

  function addLine(item: LabCatalogItem) {
    const key = `L${uid++}`;
    setLines((ls) => [...ls, { key, catalogItemId: item.id, name: item.name, priceNormal: item.priceNormal, priceVip: item.priceVip, tier: "NORMAL", shade: "", itemNotes: "", teeth: [] }]);
    setActiveKey(key);
  }
  function removeLine(key: string) {
    setLines((ls) => ls.filter((l) => l.key !== key));
    if (activeKey === key) setActiveKey(null);
  }
  function patchLine(key: string, patch: Partial<Line>) {
    setLines((ls) => ls.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }

  // assignments: fdi -> colour (for the chart)
  const assignments = useMemo(() => {
    const m: Record<number, string> = {};
    for (const l of lines) { const c = colorOf(l.key); for (const t of l.teeth) m[t] = c; }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines]);

  function toggleTooth(fdi: number) {
    if (!activeKey) { setError("اختر خدمة أولاً ثم عيّن أسنانها"); return; }
    setError(null);
    setLines((ls) =>
      ls.map((l) => {
        if (l.key === activeKey) {
          const has = l.teeth.includes(fdi);
          return { ...l, teeth: has ? l.teeth.filter((t) => t !== fdi) : [...l.teeth, fdi].sort((a, b) => a - b) };
        }
        // remove from any other owner (one tooth → one item)
        if (l.teeth.includes(fdi)) return { ...l, teeth: l.teeth.filter((t) => t !== fdi) };
        return l;
      }),
    );
  }

  // text input ↔ chart sync for the active line
  const active = lines.find((l) => l.key === activeKey) ?? null;
  function applyTeethText(text: string) {
    if (!activeKey) return;
    const nums = Array.from(new Set(text.split(/[^0-9]+/).map((s) => parseInt(s, 10)).filter((n) => ALL_FDI.includes(n))));
    setLines((ls) =>
      ls.map((l) => {
        if (l.key === activeKey) return { ...l, teeth: nums.sort((a, b) => a - b) };
        return { ...l, teeth: l.teeth.filter((t) => !nums.includes(t)) }; // steal from others
      }),
    );
  }

  function unit(l: Line) { return l.tier === "VIP" && l.priceVip !== null ? l.priceVip : l.priceNormal; }
  const total = lines.reduce((s, l) => s + unit(l) * l.teeth.length, 0);
  const ready = lines.length > 0 && lines.every((l) => l.teeth.length > 0);

  function submit() {
    setError(null);
    if (!ready) { setError("لكل خدمة يجب تحديد سنّ واحد على الأقل"); return; }
    const payload = {
      serviceType: "LAB" as const,
      note: note || undefined,
      caseFiles: caseFiles.filter((u) => u.trim()),
      lines: lines.map((l) => ({ catalogItemId: l.catalogItemId, tier: l.tier, quantity: l.teeth.length, teeth: l.teeth, shade: l.shade || undefined, itemNotes: l.itemNotes || undefined })),
    };
    startTransition(async () => {
      try {
        const { id } = await createOrder(payload);
        router.push(`/lab/orders/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر إنشاء الطلب");
      }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {/* catalog + odontogram */}
      <div className="space-y-5 lg:col-span-2">
        <Card>
          <h3 className="mb-3 font-semibold text-fg">الكتالوج — أضف الخدمات للطلب</h3>
          {items.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">لا توجد خدمات في الكتالوج بعد.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-3 rounded-lg border border-border-soft bg-surface-2/40 p-2.5">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-2">
                    {it.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.imageUrl} alt={it.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-fg-faint"><Package className="h-5 w-5" /></div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{it.name}</p>
                    <p className="text-xs text-fg-muted">{formatIQD(it.priceNormal)}{it.priceVip !== null ? ` · VIP ${formatIQD(it.priceVip)}` : ""}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addLine(it)}><Plus className="h-3.5 w-3.5" /></Button>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold text-fg">مخطّط الأسنان</h3>
            {lines.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                {lines.map((l) => (
                  <button key={l.key} type="button" onClick={() => setActiveKey(l.key)}
                    className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs ${activeKey === l.key ? "border-primary bg-primary-soft" : "border-border-soft"}`}>
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(l.key) }} />
                    {l.name} ({l.teeth.length})
                  </button>
                ))}
              </div>
            )}
          </div>
          {lines.length === 0 ? (
            <p className="py-8 text-center text-sm text-fg-muted">أضف خدمة من الكتالوج، ثم اختَرها وحدّد أسنانها على المخطّط.</p>
          ) : (
            <>
              {active && (
                <div className="mb-3 flex items-center gap-2">
                  <span className="text-xs text-fg-muted">أسنان «{active.name}»:</span>
                  <Input ref={teethInputRef} dir="ltr" className="h-9 max-w-xs" value={active.teeth.join(", ")}
                    onChange={(e) => applyTeethText(e.target.value)} placeholder="مثال: 11, 21, 26" />
                </div>
              )}
              <Odontogram assignments={assignments} onToothClick={toggleTooth} />
              <p className="mt-2 text-[11px] text-fg-faint">انقر سنّاً لتعيينه للخدمة المختارة (لون مميّز لكل خدمة). كل سنّ لخدمة واحدة.</p>
            </>
          )}
        </Card>
      </div>

      {/* order panel */}
      <Card className="h-fit lg:sticky lg:top-4">
        <h3 className="mb-3 font-semibold text-fg">طلبك</h3>
        {lines.length === 0 ? (
          <p className="py-6 text-center text-sm text-fg-muted">لم تُضِف خدمات بعد.</p>
        ) : (
          <div className="space-y-3">
            {lines.map((l) => (
              <div key={l.key} className={`rounded-lg border p-2.5 ${activeKey === l.key ? "border-primary/40 bg-primary-soft/30" : "border-border-soft bg-surface-2/40"}`}>
                <div className="flex items-start justify-between gap-2">
                  <button type="button" onClick={() => setActiveKey(l.key)} className="flex items-center gap-2 text-right">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: colorOf(l.key) }} />
                    <span className="text-sm font-medium text-fg">{l.name}</span>
                  </button>
                  <button onClick={() => removeLine(l.key)} className="text-fg-faint hover:text-danger"><Trash2 className="h-4 w-4" /></button>
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <Button size="sm" variant={l.tier === "NORMAL" ? "primary" : "subtle"} className="h-7 px-2 text-xs" onClick={() => patchLine(l.key, { tier: "NORMAL" })}>عادي</Button>
                  {l.priceVip !== null && (
                    <Button size="sm" variant={l.tier === "VIP" ? "primary" : "subtle"} className="h-7 px-2 text-xs" onClick={() => patchLine(l.key, { tier: "VIP" })}>VIP</Button>
                  )}
                  <span className="mr-auto text-xs text-fg-muted">{l.teeth.length} وحدة · {formatIQD(unit(l) * l.teeth.length)}</span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Input className="h-9" value={l.shade} onChange={(e) => patchLine(l.key, { shade: e.target.value })} placeholder="اللون (A2…)" />
                  <Input className="h-9" value={l.itemNotes} onChange={(e) => patchLine(l.key, { itemNotes: e.target.value })} placeholder="ملاحظة البند" />
                </div>
              </div>
            ))}

            <CaseFiles files={caseFiles} setFiles={setCaseFiles} />

            <Field label="ملاحظات عامة على الحالة">
              <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="تعليمات عامة…" />
            </Field>

            <div className="flex items-center justify-between border-t border-border-soft pt-3">
              <span className="text-sm text-fg-muted">الإجمالي المعروض</span>
              <span className="font-bold text-fg">{formatIQD(total)}</span>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button className="w-full" disabled={pending || !ready} onClick={() => submit()}>
              {pending ? "جارٍ الإرسال…" : "اطلب بالسعر المعروض"}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}

function CaseFiles({ files, setFiles }: { files: string[]; setFiles: (f: string[]) => void }) {
  return (
    <Field label="ملفات الحالة (روابط STL / DICOM / صور)">
      <div className="space-y-2">
        {files.map((f, i) => (
          <div key={i} className="flex gap-2">
            <Input dir="ltr" value={f} onChange={(e) => setFiles(files.map((x, j) => (j === i ? e.target.value : x)))} placeholder="https://…" />
            <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-fg-faint hover:text-danger"><X className="h-4 w-4" /></button>
          </div>
        ))}
        <Button size="sm" variant="ghost" onClick={() => setFiles([...files, ""])}><Plus className="h-3.5 w-3.5" /> إضافة رابط</Button>
      </div>
    </Field>
  );
}
