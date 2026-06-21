import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Activity, FlaskConical, Store, Wrench, Briefcase,
  Stethoscope, Building2, UserRound, Megaphone,
  ShieldCheck, ArrowLeft, MapPin, Phone, Mail, BadgeCheck,
} from "lucide-react";

const SERVICES = [
  { icon: FlaskConical, title: "المختبر", desc: "تركيبات سنية باحترافية من فريق المختبر الرسمي." },
  { icon: Store, title: "السوق", desc: "قطع غيار وأجهزة لعيادتك من كتالوج موثوق." },
  { icon: Wrench, title: "الصيانة", desc: "صيانة أجهزة العيادة مع فريق رسمي وتقرير شفّاف." },
];

const AUDIENCE = [
  { icon: Stethoscope, title: "أطباء الأسنان", desc: "اطلب الخدمات وتابع طلباتك في مكان واحد." },
  { icon: Building2, title: "العيادات", desc: "أدِر عيادتك وأجهزتها وطلبات صيانتها." },
  { icon: UserRound, title: "الباحثون عن عمل", desc: "تصفّح فرص القطاع وقدّم بسهولة." },
  { icon: Megaphone, title: "المعلنون", desc: "روّج لمنتجاتك وخدماتك للجمهور المستهدف." },
];

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      {/* header */}
      <header className="sticky top-0 z-20 border-b border-border-soft bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-[var(--primary-fg)]">
              <Activity className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold text-fg">VICTUS</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {session?.user ? (
              <Link href="/dashboard"><Button size="sm">لوحة التحكم</Button></Link>
            ) : (
              <>
                <Link href="/login"><Button variant="ghost" size="sm">دخول</Button></Link>
                <Link href="/register"><Button size="sm">إنشاء حساب</Button></Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* hero */}
      <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/60 px-4 py-1.5 text-xs text-fg-muted animate-fade-in" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>
          <ShieldCheck className="h-3.5 w-3.5 text-primary" /> منصة وطنية رقمية · العراق · IQD
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-fg sm:text-5xl animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
          كل ما يحتاجه <span className="text-primary">طبيب الأسنان</span> في مكان واحد
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-fg-muted animate-fade-up" style={{ animationDelay: "0.3s", animationFillMode: "both" }}>
          المختبر · السوق · الصيانة — إضافةً إلى الوظائف والإعلانات. منصّة عربية متكاملة لقطاع طب الأسنان في العراق.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3 animate-fade-up" style={{ animationDelay: "0.4s", animationFillMode: "both" }}>
          <Link href="/register"><Button size="lg" className="gap-2 group transition-all duration-300 hover:scale-105">ابدأ الآن <ArrowLeft className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
          <Link href="/login"><Button variant="outline" size="lg" className="transition-all duration-300 hover:scale-105">تسجيل الدخول</Button></Link>
        </div>
      </section>

      {/* three services */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-4">
        <h2 className="mb-6 text-center text-2xl font-bold text-fg animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>خدماتنا الثلاث</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 stagger-children">
          {SERVICES.map((s) => (
            <div key={s.title} className="card glass flex flex-col rounded-[var(--radius)] p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_-12px_var(--primary)] hover:border-primary/30 group">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-110">
                <s.icon className="h-6 w-6" />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-fg">{s.title}</h3>
              <p className="mt-1.5 flex-1 text-sm text-fg-muted">{s.desc}</p>
              <Link href="/register" className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline group/link">
                اعرف المزيد <ArrowLeft className="h-3.5 w-3.5 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* audience */}
      <section className="mx-auto w-full max-w-6xl px-4 py-16">
        <h2 className="mb-6 text-center text-2xl font-bold text-fg animate-fade-up" style={{ animationDelay: "0.1s", animationFillMode: "both" }}>لمن المنصة؟</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {AUDIENCE.map((a) => (
            <div key={a.title} className="rounded-[var(--radius)] border border-border-soft bg-surface-2/40 p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg group">
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-110">
                <a.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-3 font-semibold text-fg">{a.title}</h3>
              <p className="mt-1 text-xs text-fg-muted">{a.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* jobs */}
      <section className="mx-auto w-full max-w-6xl px-4 pb-16 animate-fade-up" style={{ animationDelay: "0.2s", animationFillMode: "both" }}>
        <div className="card glass flex flex-col items-center gap-4 rounded-[var(--radius)] p-8 text-center transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 sm:flex-row sm:justify-between sm:text-right group">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary transition-transform duration-300 group-hover:scale-110">
              <Briefcase className="h-6 w-6" />
            </span>
            <div>
              <h3 className="text-lg font-semibold text-fg">وظائف قطاع طب الأسنان</h3>
              <p className="mt-1 text-sm text-fg-muted">فرص عمل من العيادات والمختبرات — تصفّح وتقديم متاح للجميع.</p>
            </div>
          </div>
          <Link href="/register"><Button className="gap-2 transition-all duration-300 hover:scale-105">تصفّح الوظائف <ArrowLeft className="h-4 w-4 transition-transform group-hover:translate-x-1" /></Button></Link>
        </div>
      </section>

      {/* trust bar */}
      <section className="border-y border-border-soft bg-surface-2/30 py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-2 px-4 text-center">
          <span className="text-xs text-fg-faint">الشريك الرسمي</span>
          <div className="flex items-center gap-2 text-fg">
            <BadgeCheck className="h-5 w-5 text-primary" />
            <span className="text-lg font-bold">PROF Dental Lab</span>
          </div>
          <p className="text-xs text-fg-muted">مختبر الأسنان الرسمي المعتمد على منصّة VICTUS.</p>
        </div>
      </section>

      {/* footer */}
      <footer className="mt-auto border-t border-border-soft py-10">
        <div className="mx-auto grid w-full max-w-6xl grid-cols-1 gap-6 px-4 sm:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-[var(--primary-fg)]"><Activity className="h-4 w-4" strokeWidth={2.5} /></span>
              <span className="font-bold text-fg">VICTUS</span>
            </div>
            <p className="mt-2 text-xs text-fg-muted">منصّة خدمات طب الأسنان في العراق.</p>
          </div>
          <div className="text-sm">
            <h4 className="mb-2 font-semibold text-fg">روابط</h4>
            <ul className="space-y-1 text-fg-muted">
              <li><Link href="/register" className="hover:text-primary">إنشاء حساب</Link></li>
              <li><Link href="/login" className="hover:text-primary">تسجيل الدخول</Link></li>
            </ul>
          </div>
          <div className="text-sm">
            <h4 className="mb-2 font-semibold text-fg">تواصل</h4>
            <ul className="space-y-1.5 text-fg-muted">
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> العراق</li>
              <li className="flex items-center gap-2" dir="ltr"><Mail className="h-4 w-4 text-primary" /> support@victus.iq</li>
              <li className="flex items-center gap-2" dir="ltr"><Phone className="h-4 w-4 text-primary" /> +964</li>
            </ul>
          </div>
        </div>
        <p className="mt-8 text-center text-xs text-fg-faint">© {new Date().getFullYear()} VICTUS — جميع الحقوق محفوظة</p>
      </footer>
    </div>
  );
}
