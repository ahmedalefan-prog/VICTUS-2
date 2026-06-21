"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileText, Trash2, Loader2 } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export interface MediaItem {
  id: string;
  url: string;
  fileName: string;
  kind: string;
  mimeType?: string | null;
}

// Reusable uploader + gallery for any entity (devices, requests, docs…).
export function MediaManager({
  entityType,
  entityId,
  kind = "IMAGE",
  initial,
  canEdit = true,
  label = "الملفات والمرفقات",
  accept = "image/*,application/pdf",
}: {
  entityType: string;
  entityId: string;
  kind?: string;
  initial: MediaItem[];
  canEdit?: boolean;
  label?: string;
  accept?: string;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<MediaItem[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.set("file", file);
      fd.set("entityType", entityType);
      fd.set("entityId", entityId);
      fd.set("kind", kind);
      const res = await fetch("/api/media", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "فشل الرفع");
      setItems((prev) => [data, ...prev]);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "فشل الرفع");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function onDelete(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/media?id=${id}`, { method: "DELETE" });
    router.refresh();
  }

  const isImage = (m: MediaItem) =>
    m.kind === "IMAGE" || m.mimeType?.startsWith("image/") || /\.(png|jpe?g|webp|gif)$/i.test(m.url);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold text-fg">{label}</h3>
        {canEdit && (
          <>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={onPick}
              accept={accept}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => inputRef.current?.click()}
              className="gap-1.5"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              رفع ملف
            </Button>
          </>
        )}
      </div>

      {error && <p className="mb-2 text-sm text-danger">{error}</p>}

      {items.length === 0 ? (
        <EmptyState title="لا توجد ملفات مرفقة بعد." />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {items.map((m) => (
            <div key={m.id} className="group relative overflow-hidden rounded-lg border border-border-soft bg-surface-2/40">
              {isImage(m) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.fileName} className="h-28 w-full object-cover" />
              ) : (
                <a
                  href={m.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-28 w-full flex-col items-center justify-center gap-1 text-fg-muted"
                >
                  <FileText className="h-7 w-7" />
                  <span className="px-2 text-center text-[11px] line-clamp-2">{m.fileName}</span>
                </a>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => onDelete(m.id)}
                  className="absolute left-1 top-1 flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  title="حذف"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
