import Link from "next/link";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  Activity,
  FlaskConical,
  Store,
  Wrench,
  Briefcase,
  Megaphone,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";

const SECTORS = [
  { icon: FlaskConical, title: "خدمة المختبر", desc: "كتالوج أسعار (عادي/VIP)، سلة طلب، وتفاوض موثّق على السعر." },
  { icon: Store, title: "خدمة السوق", desc: "قطع غيار وأجهزة (جديد/مستعمل/مجدّد) من كتالوج موثوق." },
  { icon: Wrench, title: "خدمة الصيانة", desc: "طلب صيانة للأجهزة مع فريق رسمي وتقرير بتكلفة شفّافة." },
  { icon: Briefcase, title: "الوظائف والتوظيف", desc: "ربط الباحثين عن عمل بفرص القطاع — تصفّح وتقديم للجميع." },
  { icon: Megaphone, title: "نظام إعلانات", desc: "حملات مستهدفة مع تقارير المشاهدات والنقرات." },
  { icon: ShieldCheck, title: "موثوقية وتوثيق", desc: "كل طلب يُوثَّق تلقائياً — شفافية كاملة للإدارة." },
];

export default async function Home() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border-soft bg-bg/70 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-[#04211f]">
              <Activity className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold text-fg">VICTUS</span>
          </div>
          <div className="flex items-center gap-2">
            {session?.user ? (
              <Link href="/dashboard">
                <Button size="sm">لوحة التحكم</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">دخول</Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">إنشاء حساب</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-4 py-20 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-2/60 px-4 py-1.5 text-xs text-fg-muted">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          منصة وطنية رقمية · العراق · IQD
        </span>
        <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-tight tracking-tight text-fg sm:text-5xl">
          <span className="text-primary">VICTUS</span> — منصّة خدمات طب الأسنان في العراق
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-fg-muted">
          ثلاث خدمات أساسية في مكان واحد — المختبر، السوق، والصيانة — تخدم العيادات والأطباء،
          مع طبقتي توظيف وإعلانات. بواجهة عربية بالكامل وتصميم احترافي.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/register">
            <Button size="lg" className="gap-2">
              ابدأ الآن
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg">تسجيل الدخول</Button>
          </Link>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-24">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SECTORS.map((s) => (
            <div key={s.title} className="card glass rounded-[var(--radius)] p-6">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="mt-4 font-semibold text-fg">{s.title}</h3>
              <p className="mt-1.5 text-sm text-fg-muted">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="mt-auto border-t border-border-soft py-6 text-center text-xs text-fg-faint">
        © {new Date().getFullYear()} VICTUS — جميع الحقوق محفوظة · منصة قطاع طب الأسنان في العراق
      </footer>
    </div>
  );
}
