import Link from "next/link";
import { requirePermission } from "@/lib/guard";
import { prisma } from "@/lib/prisma";
import { APPLICATION_STATUS_META } from "@/lib/jobs";
import { formatDate } from "@/lib/format";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft } from "lucide-react";
import { CandidateForm } from "@/components/jobs/candidate-form";

export const metadata = { title: "ملف المرشّح" };

export default async function CandidatePage() {
  const session = await requirePermission("candidate", "VIEW");

  const [profile, applications, governorates] = await Promise.all([
    prisma.candidateProfile.findUnique({ where: { userId: session.user.id } }),
    prisma.jobApplication.findMany({
      where: { applicantId: session.user.id },
      include: { job: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.governorate.findMany({ select: { id: true, nameAr: true }, orderBy: { nameAr: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="ملف المرشّح" description="مهاراتك وخبرتك وطلباتك على الوظائف." />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CandidateForm
          governorates={governorates}
          profile={profile ? {
            headline: profile.headline ?? "",
            bio: profile.bio ?? "",
            governorateId: profile.governorateId ?? "",
            skills: profile.skills ?? "",
            experienceYears: profile.experienceYears,
            education: profile.education ?? "",
            cvUrl: profile.cvUrl ?? "",
            isOpenToWork: profile.isOpenToWork,
          } : null}
        />

        <Card>
          <h3 className="mb-3 font-semibold text-fg">طلباتي ({applications.length})</h3>
          {applications.length === 0 ? (
            <p className="py-6 text-center text-sm text-fg-muted">لم تتقدّم لأي وظيفة بعد.</p>
          ) : (
            <ul className="space-y-2">
              {applications.map((a) => (
                <li key={a.id}>
                  <Link href={`/jobs/${a.job.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2.5 transition-colors hover:border-primary/40">
                    <div>
                      <p className="text-sm font-medium text-fg">{a.job.title}</p>
                      <p className="text-xs text-fg-faint">{formatDate(a.createdAt)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={APPLICATION_STATUS_META[a.status]?.tone ?? "muted"}>{APPLICATION_STATUS_META[a.status]?.label}</Badge>
                      <ChevronLeft className="h-4 w-4 text-fg-faint" />
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
