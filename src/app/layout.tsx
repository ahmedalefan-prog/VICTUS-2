import type { Metadata, Viewport } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { Toaster } from "@/components/ui/toaster";
import { ProgressBar } from "@/components/ui/progress-bar";


const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "VICTUS — منصة قطاع طب الأسنان في العراق",
    template: "%s · VICTUS",
  },
  description:
    "VICTUS منصة رقمية متكاملة تربط عيادات وأطباء الأسنان والموردين ومهندسي الصيانة والمختبرات في العراق.",
  applicationName: "VICTUS",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "VICTUS",
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#070b14",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className={`${cairo.variable} h-full antialiased`} suppressHydrationWarning>
      <head>
        {/* Apply the saved theme before paint to avoid a flash (default: dark). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("victus-theme");if(t==="light"){document.documentElement.dataset.theme="light";}}catch(e){}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col scanline">
        <div className="futuristic-orb futuristic-orb--1" aria-hidden />
        <div className="futuristic-orb futuristic-orb--2" aria-hidden />
        <div className="futuristic-orb futuristic-orb--3" aria-hidden />
        <div className="particle-field" aria-hidden>
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
          <div className="particle" />
        </div>
        {children}
        <ServiceWorkerRegister />
        <Toaster />
        <Suspense fallback={null}>
          <ProgressBar />
        </Suspense>
      </body>
    </html>
  );
}
