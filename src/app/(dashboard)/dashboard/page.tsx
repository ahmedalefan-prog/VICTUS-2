import Link from "next/link";
import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { resolveMyService, canRequest } from "@/lib/services";
import { NAV_GROUPS } from "@/lib/nav";
import { can } from "@/lib/rbac";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { AdSlot } from "@/components/ads/ad-slot";
import { RequesterHome } from "@/components/dashboard/requester-home";
import { TeamHome } from "@/components/dashboard/team-home";
import { AdminHome } from "@/components/dashboard/admin-home";

export const metadata = { title: "لوحة التحكم" };

export default async function DashboardPage() {
  const session = await requirePermission("dashboard", "VIEW");
  const greeting = `مرحباً، ${session.user.name ?? "بك"}`;

  // ── admin ──
  if (isPlatformAdmin(session)) {
    return (
      <>
        <PageHeader title={greeting} description="نظرة الإدارة على المنصّة." />
        <AdminHome />
      </>
    );
  }

  // ── service team member ──
  const myService = await resolveMyService(session.user.id);
  if (myService) {
    return (
      <>
        <PageHeader title={greeting} description={`فريق ${myService.name}.`} />
        <TeamHome service={{ id: myService.id, type: myService.type, name: myService.name }} />
      </>
    );
  }

  // ── doctor / clinic (requester) ──
  const isRequester =
    canRequest(session, "LAB") || canRequest(session, "MARKET") || canRequest(session, "MAINTENANCE");
  if (isRequester) {
    return (
      <>
        <PageHeader title={greeting} description="طلباتك وخدمات المنصّة في مكان واحد." />
        <RequesterHome userId={session.user.id} />
      </>
    );
  }

  // ── others (job seeker / advertiser): quick access grid ──
  const perms = new Set(session.user.permissions);
  const groups = NAV_GROUPS.map((g) => ({ ...g, items: g.items.filter((it) => can(perms, it.resource, it.action)) })).filter((g) => g.items.length > 0);

  return (
    <>
      <PageHeader title={greeting} description="منصّة VICTUS لخدمات طب الأسنان." />
      <AdSlot placement="DASHBOARD" />
      <div className="space-y-6">
        {groups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <section key={group.key}>
              <div className="mb-3 flex items-center gap-2">
                <GroupIcon className="h-5 w-5 text-primary" />
                <h2 className="font-semibold text-fg">{group.title}</h2>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link key={item.href} href={item.href}>
                      <Card className="flex items-center gap-3 transition-colors hover:border-primary/40">
                        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="h-5 w-5" /></span>
                        <span className="font-medium text-fg">{item.label}</span>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </>
  );
}
