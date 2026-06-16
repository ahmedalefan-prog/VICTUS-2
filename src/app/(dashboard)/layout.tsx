import { requireApproved } from "@/lib/guard";
import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACCOUNT_TYPES } from "@/lib/rbac";
import { DashboardShell } from "@/components/layout/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireApproved();

  const unreadCount = await prisma.notification
    .count({ where: { userId: session.user.id, readAt: null } })
    .catch(() => 0);

  const accountTypeLabel =
    ACCOUNT_TYPES.find((t) => t.value === session.user.accountType)?.label ??
    session.user.accountType;

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <DashboardShell
      permissions={session.user.permissions}
      user={{
        id: session.user.id,
        name: session.user.name ?? "مستخدم",
        email: session.user.email ?? "",
        accountTypeLabel,
      }}
      unreadCount={unreadCount}
      signOutAction={signOutAction}
    >
      {children}
    </DashboardShell>
  );
}
