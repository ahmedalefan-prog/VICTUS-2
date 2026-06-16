"use client";

import { useEffect } from "react";

// تسجيل Service Worker (في الإنتاج فقط لتفادي تعارض كاش التطوير).
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/", updateViaCache: "none" })
      .catch((e) => console.error("[SW] register failed:", e));
  }, []);

  return null;
}
