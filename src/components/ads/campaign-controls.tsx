"use client";

import { useTransition, useState } from "react";
import { useRouter } from "next/navigation";
import { submitForReview, setCampaignPaused, recordLead } from "@/lib/ad-actions";
import { AD_LEAD_TYPE_META } from "@/lib/ads";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";

export function CampaignControls({ campaignId, status }: { campaignId: string; status: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try { await fn(); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "تعذّر تنفيذ العملية"); }
    });
  }

  return (
    <Card>
      <h3 className="mb-3 font-semibold text-fg">إدارة الحملة</h3>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <div className="space-y-2">
        {(status === "DRAFT" || status === "REJECTED") && (
          <Button className="w-full" disabled={pending} onClick={() => run(() => submitForReview(campaignId))}>إرسال للمراجعة</Button>
        )}
        {status === "PENDING_REVIEW" && <p className="text-sm text-fg-muted">حملتك قيد مراجعة الإدارة.</p>}
        {status === "ACTIVE" && (
          <Button variant="outline" className="w-full" disabled={pending} onClick={() => run(() => setCampaignPaused(campaignId, true))}>إيقاف مؤقت</Button>
        )}
        {status === "PAUSED" && (
          <Button className="w-full" disabled={pending} onClick={() => run(() => setCampaignPaused(campaignId, false))}>استئناف</Button>
        )}
      </div>
    </Card>
  );
}

export function LeadForm({ campaignId }: { campaignId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <h3 className="mb-3 font-semibold text-fg">تسجيل عميل محتمل</h3>
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            try { await recordLead(fd); router.refresh(); }
            catch (e) { setError(e instanceof Error ? e.message : "تعذّر التسجيل"); }
          })
        }
        className="space-y-2"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        <input type="hidden" name="campaignId" value={campaignId} />
        <Field label="النوع">
          <Select name="type" defaultValue="INQUIRY">
            {Object.entries(AD_LEAD_TYPE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </Select>
        </Field>
        <Field label="القيمة (IQD) — اختياري"><Input name="value" type="number" min="0" dir="ltr" /></Field>
        <Field label="ملاحظة — اختياري"><Input name="note" /></Field>
        <Button type="submit" variant="subtle" className="w-full" disabled={pending}>تسجيل</Button>
      </form>
    </Card>
  );
}
