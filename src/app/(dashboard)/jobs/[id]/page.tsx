import { notFound } from "next/navigation";
import Link from "next/link";
import { requirePermission, isPlatformAdmin } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { prisma } from "@/lib/prisma";
import { JOB_STATUS_META, EMPLOYMENT_TYPE_META, APPLICATION_STATUS_META } from "@/lib/jobs";
import { formatIQD, formatDate, formatDateTime } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, MapPin } from "lucide-react";
import { ApplyForm, JobStatusControls, ApplicationsManager } from "@/components/jobs/job-detail-actions";

export const metadata = { title: "تفاصيل الوظيفة" };

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await requirePermission("jobs", "VIEW");

  const job = await prisma.job.findUnique({
    where: { id },
    include: {
      postedBy: { select: { fullName: true } },
      governorate: { select: { nameAr: true } },
    },
  });
  if (!job) notFound();

  const isManager = isPlatformAdmin(session) || can(session.user.permissions, "jobs", "MANAGE") || job.postedById === session.user.id;

  // Manager sees the full applicant pipeline; others only their own application.
  const applications = isManager
    ? await prisma.jobApplication.findMany({
        where: { jobId: id },
        include: { applicant: { select: { fullName: true } } },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const myApplication = isManager
    ? null
    : await prisma.jobApplication.findUnique({ where: { jobId_applicantId: { jobId: id, applicantId: session.user.id } } });

  const salFrom = job.salaryFrom == null ? null : Number(job.salaryFrom);
  const salTo = job.salaryTo == null ? null : Number(job.salaryTo);
  const skills = job.skills?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];

  return (
    <>
      <Link href="/jobs" className="mb-3 inline-flex items-center gap-1 text-sm text-fg-muted hover:text-fg">
        <ChevronRight className="h-4 w-4" /> العودة للوظائف
      </Link>

      <PageHeader title={job.title} description={job.jobNumber}>
        <div className="flex items-center gap-2">
          <Badge tone="muted">{EMPLOYMENT_TYPE_META[job.employmentType]?.label}</Badge>
          <Badge tone={JOB_STATUS_META[job.status]?.tone ?? "muted"}>{JOB_STATUS_META[job.status]?.label}</Badge>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-fg-muted">
              {job.governorate && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.governorate.nameAr}</span>}
              {(salFrom || salTo) && (
                <span className="font-medium text-fg">
                  {salFrom && salTo ? `${formatIQD(salFrom)} — ${formatIQD(salTo)}` : salFrom ? `من ${formatIQD(salFrom)}` : `حتى ${formatIQD(salTo!)}`}
                </span>
              )}
              <span>نُشرت {formatDate(job.createdAt)}</span>
            </div>
            {skills.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {skills.map((s, i) => <Badge key={i} tone="info">{s}</Badge>)}
              </div>
            )}
            {job.description && <p className="mt-4 whitespace-pre-line text-sm text-fg-muted">{job.description}</p>}
            {job.requirements && (
              <div className="mt-4">
                <h4 className="mb-1 text-sm font-semibold text-fg">المتطلّبات</h4>
                <p className="whitespace-pre-line text-sm text-fg-muted">{job.requirements}</p>
              </div>
            )}
            <p className="mt-4 border-t border-border-soft pt-3 text-xs text-fg-faint">جهة النشر: {job.postedBy.fullName}</p>
          </Card>

          {isManager && (
            <ApplicationsManager
              applications={applications.map((a) => ({
                id: a.id,
                applicantName: a.applicant.fullName,
                coverLetter: a.coverLetter ?? "",
                cvUrl: a.cvUrl ?? "",
                status: a.status,
                at: formatDateTime(a.createdAt),
              }))}
            />
          )}
        </div>

        <div className="space-y-5">
          {isManager ? (
            <JobStatusControls jobId={job.id} status={job.status} />
          ) : myApplication ? (
            <Card>
              <h3 className="mb-2 font-semibold text-fg">طلبك</h3>
              <Badge tone={APPLICATION_STATUS_META[myApplication.status]?.tone ?? "muted"}>{APPLICATION_STATUS_META[myApplication.status]?.label}</Badge>
              <p className="mt-2 text-xs text-fg-faint">قُدّم {formatDate(myApplication.createdAt)}</p>
            </Card>
          ) : job.status === "OPEN" ? (
            <ApplyForm jobId={job.id} />
          ) : (
            <Card><p className="text-sm text-fg-muted">التقديم على هذه الوظيفة مُغلق.</p></Card>
          )}
        </div>
      </div>
    </>
  );
}
