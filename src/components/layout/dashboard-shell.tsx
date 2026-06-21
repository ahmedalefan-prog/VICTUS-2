"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Bell, Menu, X, LogOut, ChevronLeft, ChevronDown, LayoutDashboard, MoreHorizontal, Search } from "lucide-react";
import { NAV_GROUPS, DASHBOARD_NAV, MOBILE_NAV_PRIORITY } from "@/lib/nav";
import { can } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { CommandPalette } from "@/components/ui/command";
import { Tooltip } from "@/components/ui/tooltip";
import { useHotkey } from "@/hooks/use-hotkey";

interface ShellUser {
  id: string;
  name: string;
  email: string;
  accountTypeLabel: string;
}

export function DashboardShell({
  permissions,
  user,
  unreadCount,
  signOutAction,
  children,
}: {
  permissions: string[];
  user: ShellUser;
  unreadCount: number;
  signOutAction: () => Promise<void>;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const pathname = usePathname();
  const permSet = new Set(permissions);

  useHotkey({ key: "k", modifiers: ["meta"] }, () => setCmdOpen(true));
  useHotkey({ key: "k", modifiers: ["ctrl"] }, () => setCmdOpen(true));
  useHotkey({ key: "/", modifiers: ["ctrl"] }, () => setCmdOpen(true));

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  // فلترة RBAC: أبقِ العناصر المسموحة فقط، واحذف المجموعات الفارغة.
  const groups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((it) => can(permSet, it.resource, it.action)),
  })).filter((g) => g.items.length > 0);

  // افتح افتراضياً المجموعة التي تحوي الصفحة النشطة (طيّ البقية).
  const activeGroupKey = groups.find((g) => g.items.some((it) => isActive(it.href)))?.key;
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(
    () => (activeGroupKey ? { [activeGroupKey]: true } : {}),
  );
  const toggleGroup = (key: string) =>
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // الشريط السفلي (جوال): الرئيسية + أول عنصرين متاحين + التنبيهات + المزيد.
  const dashboardAllowed = can(permSet, DASHBOARD_NAV.resource, DASHBOARD_NAV.action);
  const mobileItems = MOBILE_NAV_PRIORITY.filter((it) => can(permSet, it.resource, it.action)).slice(0, 2);

  const commandItems = useMemo(() => {
    const items: { id: string; label: string; description?: string; href: string; icon?: React.ReactNode; keywords?: string[] }[] = [];
    if (dashboardAllowed) {
      items.push({ id: "dashboard", label: DASHBOARD_NAV.label, href: DASHBOARD_NAV.href, icon: <LayoutDashboard className="h-4 w-4" />, keywords: ["الرئيسية", "home"] });
    }
    for (const g of groups) {
      for (const it of g.items) {
        const Icon = it.icon;
        items.push({
          id: it.href,
          label: it.label,
          description: g.title,
          href: it.href,
          icon: <Icon className="h-4 w-4" />,
          keywords: [g.title],
        });
      }
    }
    return items;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [permissions]);

  return (
    <div className="flex min-h-screen">
      {/* overlay (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-72 shrink-0 overflow-y-auto border-l border-border-soft bg-bg-soft/80 px-3 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-[calc(1.25rem+env(safe-area-inset-top))] backdrop-blur-xl transition-transform duration-300 print:hidden",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="mb-6 flex items-center justify-between px-2">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-[var(--primary-fg)]">
              <Activity className="h-5 w-5" strokeWidth={2.5} />
            </span>
            <span className="text-lg font-bold text-fg">VICTUS</span>
          </Link>
          <button className="lg:hidden text-fg-muted" onClick={() => setOpen(false)} aria-label="إغلاق القائمة الجانبية">
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="space-y-1.5">
          {/* لوحة التحكم — مثبّتة أعلى القائمة */}
          {dashboardAllowed && (
            <Link
              href={DASHBOARD_NAV.href}
              onClick={() => setOpen(false)}
              aria-current={isActive(DASHBOARD_NAV.href) ? "page" : undefined}
              className={cn(
                "nav-glow flex items-center gap-3 rounded-lg px-3 py-2.5 pr-4 text-sm font-medium transition-colors",
                isActive(DASHBOARD_NAV.href)
                  ? "bg-primary-soft text-primary"
                  : "text-fg-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <LayoutDashboard className="h-[18px] w-[18px] shrink-0" />
              <span className="flex-1">{DASHBOARD_NAV.label}</span>
            </Link>
          )}

          {/* مجموعات قابلة للطي (Accordion) */}
          {groups.map((group) => {
            const GroupIcon = group.icon;
            const expanded = openGroups[group.key] ?? false;
            const hasActive = group.items.some((it) => isActive(it.href));
            return (
              <div key={group.key}>
                <button
                  type="button"
                  onClick={() => toggleGroup(group.key)}
                  aria-expanded={expanded}
                  className={cn(
                    "nav-glow flex w-full items-center gap-3 rounded-lg px-3 py-2.5 pr-4 text-sm font-semibold transition-colors",
                    hasActive && !expanded
                      ? "text-primary"
                      : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                  )}
                >
                  <GroupIcon className="h-[18px] w-[18px] shrink-0" />
                  <span className="flex-1 text-right">{group.title}</span>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 shrink-0 text-fg-faint transition-transform",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
                {expanded && (
                  <ul className="mt-1 space-y-1 pr-3">
                    {group.items.map((item) => {
                      const active = isActive(item.href);
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setOpen(false)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "nav-glow group flex items-center gap-3 rounded-lg px-3 py-2 pr-4 text-sm font-medium transition-colors",
                              active
                                ? "bg-primary-soft text-primary"
                                : "text-fg-muted hover:bg-surface-2 hover:text-fg",
                            )}
                          >
                            <Icon className="h-[18px] w-[18px] shrink-0" />
                            <span className="flex-1">{item.label}</span>
                            {item.soon && (
                              <span className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[10px] text-fg-faint">
                                قريباً
                              </span>
                            )}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* main column */}
      <div className={cn("flex min-w-0 flex-1 flex-col transition-[margin] duration-300", open && "lg:mr-72")}>
        <header className="sticky top-0 z-20 border-b border-border-soft bg-bg/80 pt-[env(safe-area-inset-top)] backdrop-blur-md print:hidden">
          <div className="flex h-16 items-center gap-3 px-4 lg:px-6">
          <button className="text-fg" onClick={() => setOpen((p) => !p)} aria-label={open ? "إغلاق القائمة الجانبية" : "فتح القائمة الجانبية"}>
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          <div className="flex-1" />

          <Tooltip content="⌘K للبحث السريع">
            <button
              type="button"
              onClick={() => setCmdOpen(true)}
              className="ml-2 flex h-9 items-center gap-2 rounded-lg border border-border-soft bg-surface-2/60 px-3 text-xs text-fg-faint transition-all duration-200 hover:border-primary/40 hover:text-fg-muted hover:shadow-[0_0_20px_-8px_var(--primary)] max-lg:hidden active:scale-95"
            >
              <Search className="h-4 w-4" />
              <span>بحث سريع...</span>
              <kbd className="mr-4 rounded border border-border-soft bg-surface-3 px-1.5 py-0.5 text-[10px] text-fg-faint">⌘K</kbd>
            </button>
          </Tooltip>

          <ThemeToggle />

          <Link
            href="/notifications"
            aria-label={`الإشعارات${unreadCount > 0 ? ` (${unreadCount} غير مقروء)` : ""}`}
            className="relative flex h-10 w-10 items-center justify-center rounded-lg text-fg-muted hover:bg-surface-2 hover:text-fg"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -left-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Link>

          <div className="flex items-center gap-3 border-r border-border-soft pr-3">
            <Link href={`/profile/${user.id}`} className="flex items-center gap-3 rounded-lg p-1 transition-colors hover:bg-surface-2" title="ملفي الشخصي">
              <div className="text-left">
                <p className="text-sm font-semibold leading-tight text-fg">{user.name}</p>
                <p className="text-xs text-fg-faint">{user.accountTypeLabel}</p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-3 text-sm font-bold text-primary">
                {user.name.charAt(0)}
              </span>
            </Link>
            <form action={signOutAction}>
              <Button variant="ghost" size="icon" type="submit" title="تسجيل الخروج">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:px-8 lg:py-8 lg:pb-8">
          <div className="mx-auto w-full max-w-7xl animate-fade-in">
            {children}
          </div>
        </main>
      </div>

      {/* شريط التنقّل السفلي (جوال فقط) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t border-border-soft bg-bg/70 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden print:hidden">
        {dashboardAllowed && (
          <BottomNavLink
            href={DASHBOARD_NAV.href}
            icon={LayoutDashboard}
            label="الرئيسية"
            active={isActive(DASHBOARD_NAV.href)}
            onClick={() => setOpen(false)}
          />
        )}
        {mobileItems.map((it) => (
          <BottomNavLink
            key={it.href}
            href={it.href}
            icon={it.icon}
            label={it.label}
            active={isActive(it.href)}
            onClick={() => setOpen(false)}
          />
        ))}
        <BottomNavLink
          href="/notifications"
          icon={Bell}
          label="التنبيهات"
          active={isActive("/notifications")}
          badge={unreadCount}
          onClick={() => setOpen(false)}
        />
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="المزيد من القائمة"
          className="flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium text-fg-muted"
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>المزيد</span>
        </button>
      </nav>

      <InstallPrompt />
      <CommandPalette items={commandItems} open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </div>
  );
}

function BottomNavLink({
  href,
  icon: Icon,
  label,
  active,
  badge,
  onClick,
}: {
  href: string;
  icon: typeof Bell;
  label: string;
  active: boolean;
  badge?: number;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors",
        active ? "text-primary" : "text-fg-muted",
      )}
    >
      <span className="relative">
        <Icon className="h-5 w-5" />
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1.5 -left-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold text-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </span>
      <span>{label}</span>
    </Link>
  );
}

export function PageHeader({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-gradient text-2xl font-bold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-fg-muted">{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function Breadcrumb({ items }: { items: string[] }) {
  return (
    <div className="mb-4 flex items-center gap-1.5 text-xs text-fg-faint">
      {items.map((it, i) => (
        <span key={i} className="flex items-center gap-1.5">
          {i > 0 && <ChevronLeft className="h-3 w-3" />}
          {it}
        </span>
      ))}
    </div>
  );
}
