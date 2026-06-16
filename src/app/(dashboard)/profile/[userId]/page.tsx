import { requireApproved } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ACCOUNT_TYPES } from "@/lib/rbac";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const metadata = { title: "الملف الشخصي" };

export default async function ProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  await requireApproved();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { fullName: true, accountType: true, avatarUrl: true, governorate: { select: { nameAr: true } } },
  });
  if (!user) notFound();

  const typeLabel = ACCOUNT_TYPES.find((t) => t.value === user.accountType)?.label ?? user.accountType;

  return (
    <>
      <PageHeader title="الملف الشخصي" />
      <Card className="flex items-center gap-4">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-3 text-2xl font-bold text-primary">
          {user.fullName.charAt(0)}
        </span>
        <div>
          <p className="text-lg font-semibold text-fg">{user.fullName}</p>
          <div className="mt-1 flex items-center gap-2">
            <Badge tone="info">{typeLabel}</Badge>
            {user.governorate && <span className="text-xs text-fg-muted">{user.governorate.nameAr}</span>}
          </div>
        </div>
      </Card>
    </>
  );
}
