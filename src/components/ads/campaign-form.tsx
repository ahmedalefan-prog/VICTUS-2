"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { createCampaign } from "@/lib/ad-actions";
import { AD_TYPE_META, AD_PLACEMENTS, AD_PLACEMENT_ALL, AD_MEDIA_TYPE_META, AD_CTA_META, isVideoUrl } from "@/lib/ads";
import { AdCreative } from "@/components/ads/ad-creative";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { Layers, X, Check, Plus, Image as ImageIcon, Video, Trash2 } from "lucide-react";

export function CampaignForm({ governorates }: { governorates: { code: string; nameAr: string }[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [adType, setAdType] = useState("BANNER");
  const sponsorsEntity = Boolean(AD_TYPE_META[adType]?.entityType);

  const [allPages, setAllPages] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [picker, setPicker] = useState(false);

  const [mediaType, setMediaType] = useState("SINGLE_IMAGE");
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [urlDraft, setUrlDraft] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [title, setTitle] = useState("");

  const [ctaType, setCtaType] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");

  const placementsValue = allPages ? AD_PLACEMENT_ALL : [...selected].join(",");
  const placementCount = allPages ? AD_PLACEMENTS.length : selected.size;
  const summary = allPages ? "جميع الصفحات" : selected.size === 0 ? "لم تُحدَّد صفحات بعد" : `${selected.size} صفحة محددة`;

  const toggleOne = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const addUrl = () => {
    const u = urlDraft.trim();
    if (!u) return;
    setMediaUrls((prev) => [...prev, u]);
    setUrlDraft("");
  };
  const removeUrl = (idx: number) => setMediaUrls((prev) => prev.filter((_, i) => i !== idx));

  const needsThumb = mediaType === "VIDEO" || mediaType === "MIXED";

  return (
    <form
      action={(fd) =>
        startTransition(async () => {
          setError(null);
          try {
            const res = await createCampaign(fd);
            if ("error" in res) { setError(res.error); return; }
            router.push(`/ads/${res.id}`);
          } catch (e) { setError(e instanceof Error ? e.message : "تعذّر الإنشاء"); }
        })
      }
      className="space-y-3"
    >
      {error && <p className="text-sm text-danger">{error}</p>}

      <Field label="نوع الإعلان">
        <Select name="adType" value={adType} onChange={(e) => setAdType(e.target.value)}>
          {Object.entries(AD_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </Select>
      </Field>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg-muted">الصفحات المستهدفة</label>
        <button type="button" onClick={() => setPicker(true)}
          className="flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface-2/40 px-3 py-2.5 text-sm transition-colors hover:border-primary/50">
          <span className="flex items-center gap-2 text-fg"><Layers className="h-4 w-4 text-primary" />{summary}</span>
          <span className="text-xs text-primary">اختيار الصفحات</span>
        </button>
        <input type="hidden" name="placements" value={placementsValue} />
      </div>

      <Field label="عنوان الحملة">
        <Input name="title" required placeholder="مثال: عرض خاص على كراسي الأسنان" value={title} onChange={(e) => setTitle(e.target.value)} />
      </Field>

      {sponsorsEntity && (
        <Field label={`معرّف ${AD_TYPE_META[adType]?.label}`} hint="انسخ المعرّف (ID) من صفحة العنصر الذي تريد ترويجه">
          <Input name="targetEntityId" placeholder="ID العنصر المموّل" dir="ltr" />
        </Field>
      )}

      <div className="space-y-3 rounded-lg border border-border-soft bg-surface-2/30 p-3">
        <p className="text-sm font-semibold text-fg">وسائط الإعلان</p>
        <Field label="نوع الوسائط">
          <Select name="mediaType" value={mediaType} onChange={(e) => setMediaType(e.target.value)}>
            {Object.entries(AD_MEDIA_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg-muted">روابط الوسائط (صور / فيديو)</label>
          <div className="flex gap-2">
            <Input value={urlDraft} onChange={(e) => setUrlDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addUrl(); } }}
              placeholder="رابط صورة أو YouTube / Vimeo / MP4" dir="ltr" />
            <Button type="button" variant="outline" size="icon" onClick={addUrl} title="إضافة"><Plus className="h-4 w-4" /></Button>
          </div>
          <p className="mt-1 text-[11px] text-fg-faint">الصور: JPG/PNG/WEBP · الفيديو: YouTube/Vimeo/MP4 (روابط خارجية).</p>

          {mediaUrls.length > 0 && (
            <ul className="mt-2 space-y-1">
              {mediaUrls.map((u, idx) => {
                const vid = isVideoUrl(u);
                return (
                  <li key={idx} className="flex items-center gap-2 rounded-md bg-surface-2 px-2 py-1.5 text-xs">
                    {vid ? <Video className="h-3.5 w-3.5 shrink-0 text-primary" /> : <ImageIcon className="h-3.5 w-3.5 shrink-0 text-primary" />}
                    <span className="min-w-0 flex-1 truncate text-fg-muted" dir="ltr">{u}</span>
                    <button type="button" onClick={() => removeUrl(idx)} className="text-fg-faint hover:text-danger" aria-label="حذف"><Trash2 className="h-3.5 w-3.5" /></button>
                  </li>
                );
              })}
            </ul>
          )}
          <input type="hidden" name="mediaUrls" value={JSON.stringify(mediaUrls)} />
        </div>

        {needsThumb && (
          <Field label="صورة مصغّرة للفيديو (اختياري)">
            <Input name="thumbnailUrl" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="رابط صورة" dir="ltr" />
          </Field>
        )}

        <div>
          <p className="mb-1.5 text-sm font-medium text-fg-muted">معاينة مباشرة</p>
          <AdCreative data={{ title: title || "عنوان الإعلان", mediaType, mediaUrls, thumbnailUrl, ctaType: ctaType || null, ctaUrl, autoplayMuted: false }} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field label="زر الإجراء">
          <Select name="ctaType" value={ctaType} onChange={(e) => setCtaType(e.target.value)}>
            <option value="">— بلا —</option>
            {Object.entries(AD_CTA_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <Field label="رابط الزر">
          <Input name="ctaUrl" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="/market أو https://…" dir="ltr" />
        </Field>
      </div>

      <div className="space-y-1.5 rounded-lg border border-border-soft bg-surface-2/30 p-3">
        <p className="text-sm font-semibold text-fg">خيارات العرض</p>
        <CheckRow name="autoplayMuted" label="تشغيل الفيديو تلقائياً بدون صوت" />
        <CheckRow name="pinned" label="تثبيت الإعلان أعلى الصفحة" />
        <CheckRow name="popup" label="إظهار كنافذة منبثقة (Popup)" />
        <CheckRow name="wideBanner" label="إظهار كبانر عريض" />
      </div>

      <Field label="الميزانية (IQD)"><Input name="budget" type="number" min="0" defaultValue={0} dir="ltr" /></Field>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <Field label="من"><Input name="startDate" type="date" required dir="ltr" /></Field>
        <Field label="إلى"><Input name="endDate" type="date" required dir="ltr" /></Field>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-fg-muted">الاستهداف الجغرافي (اختياري)</label>
        <div className="max-h-32 space-y-1 overflow-y-auto rounded-lg border border-border bg-surface-2/40 p-2">
          {governorates.map((g) => (
            <label key={g.code} className="flex items-center gap-2 rounded px-1.5 py-0.5 text-sm text-fg hover:bg-surface-2">
              <input type="checkbox" name="gov" value={g.code} className="accent-[var(--primary)]" />
              {g.nameAr}
            </label>
          ))}
        </div>
      </div>

      <input type="hidden" name="targetGovernorates" id="tg" />
      <Button type="submit" className="w-full" disabled={pending || placementCount === 0}
        onClick={(e) => {
          const form = (e.currentTarget as HTMLButtonElement).form;
          if (form) {
            const codes = Array.from(form.querySelectorAll<HTMLInputElement>('input[name="gov"]:checked')).map((i) => i.value);
            (form.querySelector("#tg") as HTMLInputElement).value = codes.join(",");
          }
        }}>
        {pending ? "جارٍ الإنشاء…" : "إنشاء الحملة"}
      </Button>

      {picker && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm sm:items-center" onClick={() => setPicker(false)}>
          <div className="flex max-h-[85vh] w-full flex-col rounded-t-2xl border border-border-soft bg-bg sm:max-w-md sm:rounded-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-border-soft px-4 py-3">
              <h3 className="font-semibold text-fg">اختر صفحات العرض</h3>
              <button type="button" onClick={() => setPicker(false)} className="text-fg-muted hover:text-fg"><X className="h-5 w-5" /></button>
            </div>
            <div className="overflow-y-auto px-4 py-3">
              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-primary/30 bg-primary-soft/30 px-3 py-2.5">
                <input type="checkbox" checked={allPages} onChange={(e) => setAllPages(e.target.checked)} className="h-4 w-4 accent-[var(--primary)]" />
                <span className="flex-1 text-sm font-semibold text-fg">عرض في جميع الصفحات</span>
              </label>
              <div className="my-2 text-center text-xs text-fg-faint">أو اختر صفحات محددة</div>
              <div className={allPages ? "pointer-events-none space-y-1 opacity-40" : "space-y-1"}>
                {AD_PLACEMENTS.map((p) => (
                  <label key={p.key} className="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm text-fg hover:bg-surface-2">
                    <input type="checkbox" checked={allPages || selected.has(p.key)} disabled={allPages} onChange={() => toggleOne(p.key)} className="h-4 w-4 accent-[var(--primary)]" />
                    <span className="flex-1">{p.label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-border-soft px-4 py-3">
              <span className="text-xs text-fg-faint">{allPages ? "جميع الصفحات" : `${selected.size} محددة`}</span>
              <Button type="button" size="sm" onClick={() => setPicker(false)}><Check className="ml-1 h-4 w-4" /> تم</Button>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

function CheckRow({ name, label }: { name: string; label: string }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm text-fg hover:bg-surface-2">
      <input type="checkbox" name={name} value="1" className="h-4 w-4 accent-[var(--primary)]" />
      {label}
    </label>
  );
}
