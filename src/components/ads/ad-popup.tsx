"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AdCreative, type AdCreativeData } from "@/components/ads/ad-creative";

// Popup ad: shows once per session per campaign (sessionStorage), dismissible.
export function AdPopup({ data, clickHref, campaignId }: { data: AdCreativeData; clickHref: string; campaignId: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const key = `ad-popup-${campaignId}`;
    if (typeof window !== "undefined" && !sessionStorage.getItem(key)) {
      const t = setTimeout(() => setOpen(true), 800);
      sessionStorage.setItem(key, "1");
      return () => clearTimeout(t);
    }
  }, [campaignId]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm print:hidden" onClick={() => setOpen(false)}>
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => setOpen(false)}
          className="absolute -top-3 -left-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-bg text-fg-muted shadow-lg ring-1 ring-border-soft hover:text-fg" aria-label="إغلاق">
          <X className="h-4 w-4" />
        </button>
        <AdCreative data={data} clickHref={clickHref} />
      </div>
    </div>
  );
}
