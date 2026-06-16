"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCandidateProfile } from "@/lib/job-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/input";

export interface CandidateData {
  headline: string;
  bio: string;
  governorateId: string;
  skills: string;
  experienceYears: number;
  education: string;
  cvUrl: string;
  isOpenToWork: boolean;
}

export function CandidateForm({
  profile,
  governorates,
}: {
  profile: CandidateData | null;
  governorates: { id: string; nameAr: string }[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  return (
    <Card>
      <h3 className="mb-4 font-semibold text-fg">ملف المرشّح</h3>
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null); setSaved(false);
            try { await saveCandidateProfile(fd); setSaved(true); router.refresh(); }
            catch (e) { setError(e instanceof Error ? e.message : "تعذّر الحفظ"); }
          })
        }
        className="space-y-3"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        {saved && <p className="text-sm text-success">تم حفظ الملف.</p>}

        <Field label="العنوان المهني" hint="مثال: طبيب أسنان عام — 5 سنوات خبرة">
          <Input name="headline" defaultValue={profile?.headline ?? ""} />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="سنوات الخبرة">
            <Input name="experienceYears" type="number" min="0" max="70" dir="ltr" defaultValue={profile?.experienceYears ?? 0} />
          </Field>
          <Field label="المحافظة">
            <Select name="governorateId" defaultValue={profile?.governorateId ?? ""}>
              <option value="">— غير محدّدة —</option>
              {governorates.map((g) => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
            </Select>
          </Field>
        </div>
        <Field label="المهارات" hint="مفصولة بفاصلة"><Input name="skills" defaultValue={profile?.skills ?? ""} /></Field>
        <Field label="التعليم"><Input name="education" defaultValue={profile?.education ?? ""} /></Field>
        <Field label="رابط السيرة الذاتية" hint="اختياري"><Input name="cvUrl" dir="ltr" defaultValue={profile?.cvUrl ?? ""} placeholder="https://…" /></Field>
        <Field label="نبذة"><Textarea name="bio" defaultValue={profile?.bio ?? ""} /></Field>
        <label className="flex items-center gap-2 text-sm text-fg">
          <input type="checkbox" name="isOpenToWork" defaultChecked={profile?.isOpenToWork ?? true} className="h-4 w-4 accent-[var(--primary)]" />
          متاح للعمل حالياً
        </label>
        <Button type="submit" className="w-full" disabled={pending}>{pending ? "جارٍ الحفظ…" : "حفظ الملف"}</Button>
      </form>
    </Card>
  );
}
