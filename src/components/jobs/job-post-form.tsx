"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveJob } from "@/lib/job-actions";
import { EMPLOYMENT_TYPE_META } from "@/lib/jobs";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function JobPostForm({ governorates }: { governorates: { id: string; nameAr: string }[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  if (!open) {
    return (
      <div className="mb-4 flex justify-end">
        <Button size="sm" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> نشر وظيفة</Button>
      </div>
    );
  }

  return (
    <Card className="mb-5">
      <h3 className="mb-4 font-semibold text-fg">نشر وظيفة جديدة</h3>
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            try { const { id } = await saveJob(fd); router.push(`/jobs/${id}`); }
            catch (e) { setError(e instanceof Error ? e.message : "تعذّر النشر"); }
          })
        }
        className="space-y-3"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        <Field label="عنوان الوظيفة"><Input name="title" required /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="نوع الدوام">
            <Select name="employmentType" defaultValue="FULL_TIME">
              {Object.entries(EMPLOYMENT_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </Field>
          <Field label="المحافظة">
            <Select name="governorateId" defaultValue="">
              <option value="">— غير محدّدة —</option>
              {governorates.map((g) => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
            </Select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Field label="الراتب من (IQD)"><Input name="salaryFrom" type="number" min="0" step="any" dir="ltr" /></Field>
          <Field label="الراتب إلى (IQD)"><Input name="salaryTo" type="number" min="0" step="any" dir="ltr" /></Field>
        </div>
        <Field label="المهارات" hint="مفصولة بفاصلة"><Input name="skills" placeholder="تقويم, جراحة, …" /></Field>
        <Field label="الوصف"><Textarea name="description" /></Field>
        <Field label="المتطلّبات"><Textarea name="requirements" className="min-h-16" /></Field>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={pending}>{pending ? "جارٍ النشر…" : "نشر"}</Button>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
        </div>
      </form>
    </Card>
  );
}
