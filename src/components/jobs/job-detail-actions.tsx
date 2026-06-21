"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { applyToJob, setJobStatus, deleteJob, updateApplicationStatus } from "@/lib/job-actions";
import { APPLICATION_STATUS_META, nextApplicationStatuses } from "@/lib/jobs";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Textarea, Field } from "@/components/ui/input";
import { FileText } from "lucide-react";

function useRun() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  function run(fn: () => Promise<void>, after?: () => void) {
    setError(null);
    startTransition(async () => {
      try { await fn(); after?.(); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "تعذّر تنفيذ العملية"); }
    });
  }
  return { pending, error, run };
}

// ── applicant: apply to an open job ──
export function ApplyForm({ jobId }: { jobId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_20px_-8px_var(--primary)]">
      <h3 className="mb-3 font-semibold text-fg">التقديم على الوظيفة</h3>
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            try { await applyToJob(fd); router.refresh(); }
            catch (e) { setError(e instanceof Error ? e.message : "تعذّر التقديم"); }
          })
        }
        className="space-y-3"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        <input type="hidden" name="jobId" value={jobId} />
        <Field label="رابط السيرة الذاتية" hint="اختياري"><Input name="cvUrl" dir="ltr" placeholder="https://…" /></Field>
        <Field label="رسالة تعريفية" hint="اختياري"><Textarea name="coverLetter" placeholder="لماذا أنت مناسب لهذه الوظيفة؟" /></Field>
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "جارٍ الإرسال…" : "تقديم الطلب"}</Button>
      </form>
    </Card>
  );
}

// ── poster: open/close + delete the job ──
export function JobStatusControls({ jobId, status }: { jobId: string; status: string }) {
  const router = useRouter();
  const { pending, error, run } = useRun();
  return (
    <Card className="transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_20px_-8px_var(--primary)]">
      <h3 className="mb-3 font-semibold text-fg">إدارة الوظيفة</h3>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <div className="space-y-2">
        {status !== "OPEN" && <Button className="w-full" disabled={pending} onClick={() => run(() => setJobStatus(jobId, "OPEN"))}>إعادة النشر</Button>}
        {status === "OPEN" && <Button variant="outline" className="w-full" disabled={pending} onClick={() => run(() => setJobStatus(jobId, "CLOSED"))}>إغلاق التقديم</Button>}
        <Button variant="danger" className="w-full" disabled={pending}
          onClick={() => { if (confirm("حذف الوظيفة وكل طلباتها؟")) run(() => deleteJob(jobId), () => router.push("/jobs")); }}>
          حذف الوظيفة
        </Button>
      </div>
    </Card>
  );
}

// ── poster: review applications + advance pipeline ──
interface AppItem {
  id: string;
  applicantName: string;
  coverLetter: string;
  cvUrl: string;
  status: string;
  at: string;
}

export function ApplicationsManager({ applications }: { applications: AppItem[] }) {
  const { pending, error, run } = useRun();
  if (applications.length === 0) {
    return <Card><h3 className="mb-1 font-semibold text-fg">المتقدّمون</h3><EmptyState title="لا يوجد متقدّمون بعد." /></Card>;
  }
  return (
    <Card>
      <h3 className="mb-3 font-semibold text-fg">المتقدّمون ({applications.length})</h3>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <ul className="stagger-children space-y-3">
        {applications.map((a) => {
          const nexts = nextApplicationStatuses(a.status);
          return (
            <li key={a.id} className="group rounded-lg border border-border-soft bg-surface-2/40 p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_16px_-8px_var(--primary)]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-fg">{a.applicantName}</span>
                <Badge tone={APPLICATION_STATUS_META[a.status]?.tone ?? "muted"}>{APPLICATION_STATUS_META[a.status]?.label}</Badge>
              </div>
              {a.coverLetter && <p className="mt-1.5 text-xs text-fg-muted">{a.coverLetter}</p>}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {a.cvUrl && (
                  <a href={a.cvUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-primary hover:underline" dir="ltr">
                    <FileText className="h-3.5 w-3.5" /> السيرة الذاتية
                  </a>
                )}
                <span className="mr-auto text-[11px] text-fg-faint">{a.at}</span>
              </div>
              {nexts.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {nexts.map((s) => (
                    <Button key={s} size="sm" variant={s === "REJECTED" ? "outline" : "primary"} className="h-8 px-2.5 text-xs" disabled={pending}
                      onClick={() => run(() => updateApplicationStatus(a.id, s))}>
                      {APPLICATION_STATUS_META[s]?.label}
                    </Button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
