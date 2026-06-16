"use client";

import { useState } from "react";
import { Megaphone, ChevronRight, ChevronLeft, ExternalLink, Phone, MessageCircle, CalendarPlus, ShoppingCart, Briefcase, Eye } from "lucide-react";
import { AD_CTA_META, parseVideoUrl, isVideoUrl } from "@/lib/ads";
import { cn } from "@/lib/utils";

const CTA_ICON: Record<string, typeof Eye> = {
  DETAILS: Eye,
  VISIT: ExternalLink,
  CALL: Phone,
  WHATSAPP: MessageCircle,
  BOOK: CalendarPlus,
  BUY: ShoppingCart,
  APPLY: Briefcase,
};

export interface AdCreativeData {
  title: string;
  mediaType: string;
  mediaUrls: string[];
  thumbnailUrl?: string | null;
  ctaType?: string | null;
  ctaUrl?: string | null;
  autoplayMuted?: boolean;
  wideBanner?: boolean;
}

// Unified creative renderer: image / carousel / video / mixed + CTA. Fully
// responsive. Used by AdSlot and the form's live preview.
// clickHref: click destination (tracking route). Omitted in preview mode.
export function AdCreative({ data, clickHref }: { data: AdCreativeData; clickHref?: string }) {
  const urls = (data.mediaUrls ?? []).filter(Boolean);
  const videos = urls.filter(isVideoUrl);
  const images = urls.filter((u) => !isVideoUrl(u));

  const showVideoFirst = data.mediaType === "VIDEO" || data.mediaType === "MIXED";
  const firstVideo = videos[0];
  const galleryImages = data.mediaType === "VIDEO" ? [] : images;

  const ctaLabel = data.ctaType ? AD_CTA_META[data.ctaType]?.label : null;
  const CtaIcon = data.ctaType ? (CTA_ICON[data.ctaType] ?? ExternalLink) : ExternalLink;

  const hasMedia = (showVideoFirst && firstVideo) || galleryImages.length > 0;

  return (
    <div className={cn("overflow-hidden rounded-[var(--radius)] border border-primary/30 bg-primary-soft/30", data.wideBanner && "w-full")}>
      {showVideoFirst && firstVideo && <VideoPlayer url={firstVideo} poster={data.thumbnailUrl} autoplayMuted={data.autoplayMuted} />}
      {galleryImages.length > 1 ? (
        <Carousel images={galleryImages} title={data.title} clickHref={clickHref} />
      ) : galleryImages.length === 1 ? (
        <MediaLink clickHref={clickHref}>
          {/* eslint-disable-next-line @next/next/no-img-element -- external ad domains */}
          <img src={galleryImages[0]} alt={data.title} className="aspect-video w-full object-cover" />
        </MediaLink>
      ) : null}

      {!hasMedia && (
        <div className="flex aspect-video w-full items-center justify-center bg-primary/10">
          <Megaphone className="h-10 w-10 text-primary/60" />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-fg">{data.title}</p>
          <p className="text-[11px] text-primary">إعلان مموّل</p>
        </div>
        {ctaLabel &&
          (clickHref ? (
            <a href={clickHref} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-[#04211f] transition-opacity hover:opacity-90">
              <CtaIcon className="h-3.5 w-3.5" /> {ctaLabel}
            </a>
          ) : (
            <span className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-[#04211f]">
              <CtaIcon className="h-3.5 w-3.5" /> {ctaLabel}
            </span>
          ))}
      </div>
    </div>
  );
}

function MediaLink({ clickHref, children }: { clickHref?: string; children: React.ReactNode }) {
  if (clickHref) return <a href={clickHref} className="block">{children}</a>;
  return <div className="block">{children}</div>;
}

function VideoPlayer({ url, poster, autoplayMuted }: { url: string; poster?: string | null; autoplayMuted?: boolean }) {
  const src = parseVideoUrl(url);
  if (!src) return null;
  if (src.kind === "file") {
    return (
      <video
        src={src.embedUrl}
        poster={poster ?? undefined}
        controls
        playsInline
        muted={autoplayMuted}
        autoPlay={autoplayMuted}
        loop={autoplayMuted}
        className="aspect-video w-full bg-black object-contain"
      />
    );
  }
  const autoplay = autoplayMuted ? (src.kind === "youtube" ? "?autoplay=1&mute=1" : "?autoplay=1&muted=1") : "";
  return (
    <div className="aspect-video w-full bg-black">
      <iframe
        src={`${src.embedUrl}${autoplay}`}
        title="إعلان فيديو"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="h-full w-full"
      />
    </div>
  );
}

function Carousel({ images, title, clickHref }: { images: string[]; title: string; clickHref?: string }) {
  const [i, setI] = useState(0);
  const go = (d: number) => setI((p) => (p + d + images.length) % images.length);
  return (
    <div className="relative">
      <MediaLink clickHref={clickHref}>
        {/* eslint-disable-next-line @next/next/no-img-element -- external ad domains */}
        <img src={images[i]} alt={`${title} ${i + 1}`} className="aspect-video w-full object-cover" />
      </MediaLink>
      <button type="button" onClick={(e) => { e.preventDefault(); go(1); }}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70" aria-label="التالي">
        <ChevronRight className="h-4 w-4" />
      </button>
      <button type="button" onClick={(e) => { e.preventDefault(); go(-1); }}
        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white backdrop-blur-sm hover:bg-black/70" aria-label="السابق">
        <ChevronLeft className="h-4 w-4" />
      </button>
      <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 gap-1.5">
        {images.map((_, idx) => (
          <button key={idx} type="button" onClick={(e) => { e.preventDefault(); setI(idx); }}
            className={cn("h-1.5 rounded-full transition-all", idx === i ? "w-4 bg-white" : "w-1.5 bg-white/50")} aria-label={`صورة ${idx + 1}`} />
        ))}
      </div>
    </div>
  );
}
