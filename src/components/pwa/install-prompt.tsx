"use client";

import { useEffect, useState } from "react";
import { Download, X, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "victus-install-dismissed";

// شريط تثبيت التطبيق: زرّ مباشر على Android/Chrome (beforeinstallprompt)،
// وتعليمات «أضف إلى الشاشة الرئيسية» على iOS. يختفي إذا كان مثبّتاً أو رُفض.
export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [state, setState] = useState<{ show: boolean; isIOS: boolean }>({ show: false, isIOS: false });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return; // مثبّت بالفعل
    if (localStorage.getItem(DISMISS_KEY)) return; // رُفض سابقاً

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as unknown as { MSStream?: unknown }).MSStream;
    if (isIOS) {
      // iOS لا يدعم beforeinstallprompt — نعرض التعليمات مباشرة.
      // eslint-disable-next-line react-hooks/set-state-in-effect -- كشف بيئة لمرة واحدة بعد التركيب (آمن، لا يسبب تتالياً ملموساً)
      setState({ show: true, isIOS: true });
      return;
    }

    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setState({ show: true, isIOS: false });
    };
    const onInstalled = () => setState((s) => ({ ...s, show: false }));
    window.addEventListener("beforeinstallprompt", onBIP);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const dismiss = () => {
    setState((s) => ({ ...s, show: false }));
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch {}
  };

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    const choice = await deferred.userChoice;
    if (choice.outcome === "accepted") setState((s) => ({ ...s, show: false }));
    setDeferred(null);
  };

  if (!state.show) return null;

  return (
    <div className="fixed inset-x-3 bottom-20 z-40 mx-auto max-w-md rounded-xl border border-border-soft bg-bg-soft/95 p-3 shadow-lg backdrop-blur-md lg:bottom-5 print:hidden">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-[#04211f]">
          <Download className="h-5 w-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-fg">ثبّت تطبيق VICTUS</p>
          {state.isIOS ? (
            <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-fg-muted">
              اضغط زر المشاركة <Share className="inline h-3.5 w-3.5" /> ثم «إضافة إلى الشاشة الرئيسية».
            </p>
          ) : (
            <p className="mt-0.5 text-xs text-fg-muted">وصول أسرع وعمل يشبه التطبيقات الأصلية على جهازك.</p>
          )}
        </div>
        <button onClick={dismiss} className="shrink-0 text-fg-faint hover:text-fg" aria-label="إغلاق">
          <X className="h-4 w-4" />
        </button>
      </div>
      {!state.isIOS && (
        <button
          onClick={install}
          className="mt-2.5 w-full rounded-lg bg-primary py-2 text-sm font-semibold text-[#04211f] transition-opacity hover:opacity-90"
        >
          تثبيت الآن
        </button>
      )}
    </div>
  );
}
