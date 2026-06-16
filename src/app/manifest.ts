import type { MetadataRoute } from "next";

// Web App Manifest — يجعل VICTUS قابلاً للتثبيت على الشاشة الرئيسية.
// يُقدَّم تلقائياً على /manifest.webmanifest
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "VICTUS — منصة قطاع طب الأسنان",
    short_name: "VICTUS",
    description: "منصة رقمية متكاملة لعيادات وأطباء الأسنان والموردين والمختبرات في العراق.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: "#070b14",
    theme_color: "#070b14",
    categories: ["medical", "business", "productivity"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "لوحة التحكم", url: "/dashboard" },
      { name: "المرضى", url: "/modules/patients" },
      { name: "المواعيد", url: "/modules/appointments" },
      { name: "التنبيهات", url: "/notifications" },
    ],
  };
}
