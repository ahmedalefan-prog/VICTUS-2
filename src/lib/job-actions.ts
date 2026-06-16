"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireApproved, requirePermission, isPlatformAdmin } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { recordAudit, logActivity } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications";
import {
  EMPLOYMENT_TYPES,
  JOB_STATUSES,
  APPLICATION_STATUSES,
  nextApplicationStatuses,
} from "@/lib/jobs";

type Session = Awaited<ReturnType<typeof requireApproved>>;

function actorName(session: Session) {
  return session.user.name ?? session.user.email ?? "مستخدم";
}

async function nextJobNumber(): Promise<string> {
  const count = await prisma.job.count();
  return `JOB-${String(count + 1).padStart(5, "0")}`;
}

// Manage rights: platform admin, jobs:MANAGE, or the user who posted the job.
function canManageJob(session: Session, job: { postedById: string }): boolean {
  return isPlatformAdmin(session) || can(session.user.permissions, "jobs", "MANAGE") || job.postedById === session.user.id;
}

// ─────────────────────── post / edit a job ───────────────────────

const jobSchema = z.object({
  id: z.string().optional().or(z.literal("")),
  title: z.string().min(3, "عنوان الوظيفة مطلوب").max(200),
  description: z.string().max(4000).optional().or(z.literal("")),
  employmentType: z.enum(EMPLOYMENT_TYPES as [string, ...string[]]).default("FULL_TIME"),
  governorateId: z.string().optional().or(z.literal("")),
  salaryFrom: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().min(0).optional()),
  salaryTo: z.preprocess((v) => (v === "" || v == null ? undefined : Number(v)), z.number().min(0).optional()),
  skills: z.string().max(500).optional().or(z.literal("")),
  requirements: z.string().max(2000).optional().or(z.literal("")),
});

export async function saveJob(formData: FormData): Promise<{ id: string }> {
  const session = await requirePermission("jobs", "CREATE");
  const parsed = jobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  const data = {
    title: d.title,
    description: d.description || null,
    employmentType: d.employmentType as never,
    governorateId: d.governorateId || null,
    salaryFrom: d.salaryFrom ?? null,
    salaryTo: d.salaryTo ?? null,
    skills: d.skills || null,
    requirements: d.requirements || null,
  };

  if (d.id) {
    const job = await prisma.job.findUnique({ where: { id: d.id }, select: { postedById: true } });
    if (!job) throw new Error("الوظيفة غير موجودة");
    if (!canManageJob(session, job)) throw new Error("لا تملك صلاحية على هذه الوظيفة");
    await prisma.job.update({ where: { id: d.id }, data });
    await logActivity({ actorId: session.user.id, verb: "job.updated", summary: `عدّل وظيفة: ${d.title}`, entityType: "Job", entityId: d.id });
    revalidatePath(`/jobs/${d.id}`);
    revalidatePath("/jobs");
    return { id: d.id };
  }

  const jobNumber = await nextJobNumber();
  const job = await prisma.job.create({ data: { ...data, jobNumber, postedById: session.user.id, status: "OPEN" } });
  await recordAudit({ actorId: session.user.id, action: "job.create", entityType: "Job", entityId: job.id });
  await logActivity({ actorId: session.user.id, verb: "job.created", summary: `نشر وظيفة ${jobNumber}: ${d.title}`, entityType: "Job", entityId: job.id });
  revalidatePath("/jobs");
  return { id: job.id };
}

export async function setJobStatus(id: string, status: string): Promise<void> {
  const session = await requireApproved();
  const job = await prisma.job.findUnique({ where: { id }, select: { postedById: true } });
  if (!job) throw new Error("الوظيفة غير موجودة");
  if (!canManageJob(session, job)) throw new Error("لا تملك صلاحية على هذه الوظيفة");
  if (!JOB_STATUSES.includes(status)) throw new Error("حالة غير صالحة");

  await prisma.job.update({ where: { id }, data: { status: status as never } });
  await recordAudit({ actorId: session.user.id, action: "job.status", entityType: "Job", entityId: id, metadata: { status } });
  revalidatePath(`/jobs/${id}`);
  revalidatePath("/jobs");
}

export async function deleteJob(id: string): Promise<void> {
  const session = await requireApproved();
  const job = await prisma.job.findUnique({ where: { id }, select: { postedById: true, title: true } });
  if (!job) throw new Error("الوظيفة غير موجودة");
  if (!canManageJob(session, job)) throw new Error("لا تملك صلاحية على هذه الوظيفة");

  await prisma.job.delete({ where: { id } });
  await logActivity({ actorId: session.user.id, verb: "job.deleted", summary: `حذف وظيفة: ${job.title}`, entityType: "Job", entityId: id });
  revalidatePath("/jobs");
}

// ─────────────────────── apply (any approved user) ───────────────────────

const applySchema = z.object({
  jobId: z.string().min(1),
  coverLetter: z.string().max(2000).optional().or(z.literal("")),
  cvUrl: z.string().url("رابط سيرة ذاتية غير صالح").optional().or(z.literal("")),
});

export async function applyToJob(formData: FormData): Promise<void> {
  const session = await requirePermission("jobs", "VIEW");
  const parsed = applySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  const job = await prisma.job.findUnique({ where: { id: d.jobId }, select: { id: true, title: true, postedById: true, status: true } });
  if (!job || job.status !== "OPEN") throw new Error("الوظيفة غير متاحة للتقديم");
  if (job.postedById === session.user.id) throw new Error("لا يمكنك التقديم على وظيفتك");

  const existing = await prisma.jobApplication.findUnique({ where: { jobId_applicantId: { jobId: d.jobId, applicantId: session.user.id } } });
  if (existing) throw new Error("سبق أن تقدّمت لهذه الوظيفة");

  await prisma.jobApplication.create({
    data: { jobId: d.jobId, applicantId: session.user.id, coverLetter: d.coverLetter || null, cvUrl: d.cvUrl || null, status: "SUBMITTED" },
  });
  await logActivity({ actorId: session.user.id, verb: "job.applied", summary: `تقدّم لوظيفة: ${job.title}`, entityType: "Job", entityId: job.id });
  await dispatchNotification({ event: "job.applicationReceived", userId: job.postedById, data: { name: actorName(session), job: job.title }, link: `/jobs/${job.id}` });
  revalidatePath(`/jobs/${d.jobId}`);
}

export async function updateApplicationStatus(applicationId: string, status: string): Promise<void> {
  const session = await requireApproved();
  const app = await prisma.jobApplication.findUnique({
    where: { id: applicationId },
    include: { job: { select: { id: true, title: true, postedById: true } } },
  });
  if (!app) throw new Error("الطلب غير موجود");
  if (!canManageJob(session, app.job)) throw new Error("لا تملك صلاحية على هذه الوظيفة");
  if (!APPLICATION_STATUSES.includes(status)) throw new Error("حالة غير صالحة");
  if (status !== app.status && !nextApplicationStatuses(app.status).includes(status)) throw new Error("انتقال غير مسموح");

  await prisma.jobApplication.update({ where: { id: applicationId }, data: { status: status as never } });
  await recordAudit({ actorId: session.user.id, action: "application.status", entityType: "JobApplication", entityId: applicationId, metadata: { status } });
  await dispatchNotification({ event: "application.statusChanged", userId: app.applicantId, data: { job: app.job.title, status }, link: `/jobs/${app.job.id}` });
  revalidatePath(`/jobs/${app.job.id}`);
}

// ─────────────────────── candidate profile ───────────────────────

const candidateSchema = z.object({
  headline: z.string().max(160).optional().or(z.literal("")),
  bio: z.string().max(2000).optional().or(z.literal("")),
  governorateId: z.string().optional().or(z.literal("")),
  skills: z.string().max(500).optional().or(z.literal("")),
  experienceYears: z.preprocess((v) => (v === "" || v == null ? 0 : Number(v)), z.number().int().min(0).max(70)),
  education: z.string().max(500).optional().or(z.literal("")),
  cvUrl: z.string().url("رابط سيرة ذاتية غير صالح").optional().or(z.literal("")),
  isOpenToWork: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});

export async function saveCandidateProfile(formData: FormData): Promise<void> {
  const session = await requirePermission("candidate", "EDIT");
  const parsed = candidateSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const d = parsed.data;

  const data = {
    headline: d.headline || null,
    bio: d.bio || null,
    governorateId: d.governorateId || null,
    skills: d.skills || null,
    experienceYears: d.experienceYears,
    education: d.education || null,
    cvUrl: d.cvUrl || null,
    isOpenToWork: d.isOpenToWork,
  };

  await prisma.candidateProfile.upsert({
    where: { userId: session.user.id },
    update: data,
    create: { userId: session.user.id, ...data },
  });
  await logActivity({ actorId: session.user.id, verb: "candidate.saved", summary: "حدّث ملف المرشّح", entityType: "CandidateProfile", entityId: session.user.id });
  revalidatePath("/candidate");
}
