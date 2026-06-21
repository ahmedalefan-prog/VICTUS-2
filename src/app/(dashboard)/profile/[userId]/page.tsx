import { requireApproved } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ACCOUNT_TYPES } from "@/lib/rbac";
import { formatDateTime } from "@/lib/format";
import { Mail, Phone, Calendar, Clock, Building, Activity, MapPin, Sparkles, ShieldCheck } from "lucide-react";

export const metadata = { title: "الملف الشخصي" };

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  await requireApproved();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      fullName: true,
      email: true,
      phone: true,
      accountType: true,
      status: true,
      avatarUrl: true,
      lastLoginAt: true,
      createdAt: true,
      governorate: { select: { nameAr: true } },
      serviceMemberships: {
        select: { service: { select: { name: true } }, role: true },
      },
      ownedClinics: {
        select: { name: true },
      },
    },
  });
  if (!user) notFound();

  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === user.accountType)?.label ?? user.accountType;
  const initial = user.fullName.charAt(0);

  return (
    <div className="relative">
      {/* cover */}
      <div className="relative mb-8 overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent sm:mb-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -left-16 -top-16 h-64 w-64 rounded-full bg-primary/20 blur-[100px]" />
          <div className="absolute -right-16 -top-8 h-48 w-48 rounded-full bg-accent/15 blur-[80px]" />
          <div className="absolute bottom-0 left-1/3 h-32 w-32 rounded-full bg-primary/10 blur-[60px]" />
          <div className="animate-float-slow absolute right-1/4 top-8 h-24 w-24 rounded-full border border-primary/10 bg-primary/5 blur-sm" />
          <div className="animate-float-slower absolute left-1/4 top-16 h-16 w-16 rounded-full border border-accent/10 bg-accent/5 blur-sm" />
          {/* grid dots */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: "radial-gradient(circle, var(--primary) 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
        </div>

        <div className="relative flex flex-col items-center px-6 pb-8 pt-16 sm:flex-row sm:items-end sm:gap-8 sm:pb-6 sm:pt-24">
          {/* avatar */}
          <div className="group relative mb-0">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse-glow rounded-full opacity-60" />
              <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-primary via-accent to-primary opacity-40 blur-sm" />
              <span className="relative flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-surface to-surface-2 text-4xl font-bold shadow-[0_0_40px_-8px_var(--primary)] ring-2 ring-primary/30">
                {initial}
              </span>
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full border-2 border-bg bg-success shadow-[0_0_12px_-2px_var(--success)]" />
          </div>

          {/* info */}
          <div className="mt-2 text-center sm:mt-0 sm:pb-2 sm:text-right">
            <h1 className="bg-gradient-to-l from-fg via-fg to-primary bg-clip-text text-2xl font-bold text-transparent sm:text-3xl">
              {user.fullName}
            </h1>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary backdrop-blur-sm">
                <Sparkles className="h-3 w-3" /> {typeLabel}
              </span>
              {user.governorate && (
                <span className="inline-flex items-center gap-1 rounded-full border border-border-soft bg-surface/40 px-3 py-0.5 text-xs text-fg-muted backdrop-blur-sm">
                  <MapPin className="h-3 w-3" /> {user.governorate.nameAr}
                </span>
              )}
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-0.5 text-xs font-medium backdrop-blur-sm ${
                user.status === "APPROVED"
                  ? "border-success/30 bg-success/10 text-success"
                  : user.status === "PENDING"
                  ? "border-warning/30 bg-warning/10 text-warning"
                  : "border-danger/30 bg-danger/10 text-danger"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  user.status === "APPROVED" ? "bg-success" : user.status === "PENDING" ? "bg-warning" : "bg-danger"
                }`} />
                {user.status === "APPROVED" ? "مفعل" : user.status === "PENDING" ? "قيد المراجعة" : "معلق"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* stats quick row */}
      <div className="stagger-children mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Calendar} label="تاريخ التسجيل" value={formatDateTime(user.createdAt)} />
        {user.lastLoginAt && <StatCard icon={Clock} label="آخر دخول" value={formatDateTime(user.lastLoginAt)} />}
        <StatCard icon={Building} label="العيادات" value={String(user.ownedClinics.length)} />
        <StatCard icon={Activity} label="الخدمات" value={String(user.serviceMemberships.length)} />
      </div>

      {/* detail cards */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3 stagger-children">
        <div className="lg:col-span-2 space-y-5">
          {/* contact */}
          <GlowCard title="معلومات الاتصال" icon={Mail}>
            <div className="space-y-4">
              <Row icon={Mail} label="البريد" value={user.email} dir="ltr" />
              {user.phone && <Row icon={Phone} label="الهاتف" value={user.phone} dir="ltr" />}
            </div>
          </GlowCard>

          {/* service memberships */}
          {user.serviceMemberships.length > 0 && (
            <GlowCard title="الخدمات المتابعة" icon={Activity}>
              <div className="space-y-2">
                {user.serviceMemberships.map((m, i) => (
                  <div key={i} className="group flex items-center gap-3 rounded-xl border border-border-soft/50 bg-surface/30 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_24px_-12px_var(--primary)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Activity className="h-4 w-4" />
                    </span>
                    <span className="flex-1 text-sm font-medium text-fg">{m.service.name}</span>
                    <span className="rounded-md bg-surface-3 px-2 py-0.5 text-xs text-fg-muted">{m.role === "MANAGER" ? "مدير" : "عضو"}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}

          {/* clinics */}
          {user.ownedClinics.length > 0 && (
            <GlowCard title="العيادات المملوكة" icon={Building}>
              <div className="space-y-2">
                {user.ownedClinics.map((c, i) => (
                  <div key={i} className="group flex items-center gap-3 rounded-xl border border-border-soft/50 bg-surface/30 px-4 py-3 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:shadow-[0_0_24px_-12px_var(--primary)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Building className="h-4 w-4" />
                    </span>
                    <span className="text-sm font-medium text-fg">{c.name}</span>
                  </div>
                ))}
              </div>
            </GlowCard>
          )}
        </div>

        {/* activity sidebar */}
        <div className="space-y-5">
          <GlowCard title="نشاط الحساب" icon={ShieldCheck}>
            <div className="space-y-4">
              <Row icon={Calendar} label="تاريخ التسجيل" value={formatDateTime(user.createdAt)} />
              {user.lastLoginAt && <Row icon={Clock} label="آخر دخول" value={formatDateTime(user.lastLoginAt)} />}
            </div>
          </GlowCard>
        </div>
      </div>

      {/* futuristic keyline accent */}
      <div className="mt-8 flex items-center gap-3 text-[10px] text-fg-faint">
        <span className="h-px flex-1 bg-gradient-to-l from-primary/40 via-accent/20 to-transparent" />
        <span>VICTUS · ID {userId.slice(0, 6).toUpperCase()}</span>
        <span className="h-px flex-1 bg-gradient-to-r from-primary/40 via-accent/20 to-transparent" />
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, dir }: { icon: typeof Mail; label: string; value: string; dir?: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-fg-muted">{label}</p>
        <p className="truncate font-medium text-fg" dir={dir}>{value}</p>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="group rounded-2xl border border-border-soft/50 bg-surface/30 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_0_30px_-12px_var(--primary)]">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_20px_-8px_var(--primary)]">
        <Icon className="h-4 w-4" />
      </span>
      <p className="mt-3 text-xs text-fg-muted">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-fg">{value}</p>
    </div>
  );
}

function GlowCard({ title, icon: Icon, children }: { title: string; icon: typeof Mail; children: React.ReactNode }) {
  return (
    <div className="group rounded-2xl border border-border-soft/40 bg-surface/20 p-5 backdrop-blur-xl transition-all duration-300 hover:border-primary/20 hover:shadow-[0_0_40px_-16px_var(--primary)]">
      {title && (
        <div className="mb-4 flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_0_16px_-6px_var(--primary)]">
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-bold text-fg">{title}</h3>
        </div>
      )}
      {children}
    </div>
  );
}
