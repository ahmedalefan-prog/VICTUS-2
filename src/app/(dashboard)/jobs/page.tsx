import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { JOB_STATUS_META, EMPLOYMENT_TYPE_META } from "@/lib/jobs";
import { formatIQD, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, MapPin, Users, ChevronLeft } from "lucide-react";
import { JobPostForm } from "@/components/jobs/job-post-form";
import { AdSlot } from "@/components/ads/ad-slot";

export const metadata = { title: "الوظائف" };

type JobRow = {
  id: string; jobNumber: string; title: string; employmentType: string; status: string;
  salaryFrom: unknown; salaryTo: unknown; createdAt: Date;
  governorate: { nameAr: string } | null; _count: { applications: number };
};

function salaryLabel(from: unknown, to: unknown): string | null {
  const f = from == null ? null : Number(from);
  const t = to == null ? null : Number(to);
  if (f && t) return `${formatIQD(f)} — ${formatIQD(t)}`;
  if (f) return `من ${formatIQD(f)}`;
  if (t) return `حتى ${formatIQD(t)}`;
  return null;
}

function JobCard({ j, showStatus }: { j: JobRow; showStatus?: boolean }) {
  const sal = salaryLabel(j.salaryFrom, j.salaryTo);
  return (
    <Link href={`/jobs/${j.id}`}>
      <Card className="flex flex-wrap items-center justify-between gap-3 transition-colors hover:border-primary/40">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-fg">{j.title}</p>
            <Badge tone="muted">{EMPLOYMENT_TYPE_META[j.employmentType]?.label}</Badge>
            {showStatus && <Badge tone={JOB_STATUS_META[j.status]?.tone ?? "muted"}>{JOB_STATUS_META[j.status]?.label}</Badge>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
            <span>{j.jobNumber}</span>
            {j.governorate && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{j.governorate.nameAr}</span>}
            {sal && <span>{sal}</span>}
            <span className="flex items-center gap-1"><Users className="h-3 w-3" />{j._count.applications} متقدّم</span>
            <span>{formatDate(j.createdAt)}</span>
          </div>
        </div>
        <ChevronLeft className="h-4 w-4 text-fg-faint" />
      </Card>
    </Link>
  );
}

export default async function JobsPage() {
  const session = await requirePermission("jobs", "VIEW");
  const canCreate = can(session.user.permissions, "jobs", "CREATE");

  const [openJobs, myJobs, governorates] = await Promise.all([
    prisma.job.findMany({
      where: { status: "OPEN" },
      include: { governorate: { select: { nameAr: true } }, _count: { select: { applications: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    canCreate
      ? prisma.job.findMany({
          where: { postedById: session.user.id },
          include: { governorate: { select: { nameAr: true } }, _count: { select: { applications: true } } },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([] as JobRow[]),
    canCreate ? prisma.governorate.findMany({ select: { id: true, nameAr: true }, orderBy: { nameAr: "asc" } }) : Promise.resolve([]),
  ]);

  return (
    <>
      <PageHeader title="الوظائف" description="لوحة الوظائف — تصفّح وتقديم متاح للجميع.">
        <Badge tone="primary">{openJobs.length} وظيفة</Badge>
      </PageHeader>

      <AdSlot placement="JOBS" />

      {canCreate && <JobPostForm governorates={governorates} />}

      {canCreate && myJobs.length > 0 && (
        <Card className="mb-5">
          <h3 className="mb-3 font-semibold text-fg">وظائفي المنشورة</h3>
          <div className="space-y-2">{myJobs.map((j) => <JobCard key={j.id} j={j} showStatus />)}</div>
        </Card>
      )}

      <h3 className="mb-3 font-semibold text-fg">وظائف منشورة</h3>
      {openJobs.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Briefcase className="mb-3 h-10 w-10 text-fg-faint" />
          <p className="font-medium text-fg">لا توجد وظائف منشورة حالياً</p>
        </Card>
      ) : (
        <div className="space-y-3">{openJobs.map((j) => <JobCard key={j.id} j={j} />)}</div>
      )}
    </>
  );
}
