import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { resolveMyService, myServiceRole } from "@/lib/services";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, Handshake } from "lucide-react";
import { TeamManager } from "@/components/services/team-manager";

export const metadata = { title: "فريق الخدمة" };

export default async function ConsoleTeamPage() {
  const session = await requirePermission("services", "VIEW");
  const service = await resolveMyService(session.user.id);

  if (!service) {
    return (
      <>
        <PageHeader title="فريق الخدمة" />
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Handshake className="mb-3 h-10 w-10 text-fg-faint" />
          <p className="font-medium text-fg">لست عضواً في أي خدمة</p>
        </Card>
      </>
    );
  }

  const role = await myServiceRole(service.id, session.user.id);
  const isAdmin = session.user.permissions.includes("users:VIEW");
  const canManage = role === "MANAGER" || isAdmin;

  const members = await prisma.serviceMember.findMany({
    where: { serviceId: service.id },
    include: { user: { select: { id: true, fullName: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <Link href="/console" className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronRight className="h-4 w-4" /> العودة للكونسول
      </Link>
      <PageHeader title={`فريق ${service.name}`} description="أعضاء الفريق وأدوارهم.">
        <Badge tone="primary">{members.length} عضو</Badge>
      </PageHeader>

      <TeamManager
        canManage={canManage}
        members={members.map((m) => ({
          id: m.id,
          name: m.user.fullName,
          email: m.user.email,
          role: m.role,
          isSelf: m.userId === session.user.id,
        }))}
      />
    </>
  );
}
