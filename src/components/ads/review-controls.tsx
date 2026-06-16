"use client";

import { useTransition, useState } from "react";
import { approveCampaign, rejectCampaign, confirmPayment, savePricing } from "@/lib/ad-admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ReviewActions({ campaignId }: { campaignId: string }) {
  const [pending, startTransition] = useTransition();
  const [ref, setRef] = useState("");
  const [showPay, setShowPay] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showPay ? (
        <>
          <Input value={ref} onChange={(e) => setRef(e.target.value)} placeholder="مرجع التحويل" className="h-9 w-40" dir="ltr" />
          <Button size="sm" disabled={pending} onClick={() => startTransition(async () => { await confirmPayment(campaignId, ref); setShowPay(false); })}>تأكيد الدفع</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowPay(false)}>إلغاء</Button>
        </>
      ) : (
        <>
          <Button size="sm" disabled={pending} onClick={() => startTransition(() => approveCampaign(campaignId))}>اعتماد وتفعيل</Button>
          <Button size="sm" variant="outline" onClick={() => setShowPay(true)}>تأكيد دفع</Button>
          <Button size="sm" variant="danger" disabled={pending} onClick={() => startTransition(() => rejectCampaign(campaignId))}>رفض</Button>
        </>
      )}
    </div>
  );
}

export function PricingForm({ adType, price, unit, label }: { adType: string; price: number; unit: string; label: string }) {
  const [pending, startTransition] = useTransition();
  const [ok, setOk] = useState(false);
  return (
    <form
      action={(fd) => startTransition(async () => { setOk(false); await savePricing(fd); setOk(true); })}
      className="flex items-end gap-2 rounded-lg border border-border-soft bg-surface-2/40 p-2"
    >
      <input type="hidden" name="adType" value={adType} />
      <div className="flex-1">
        <label className="block text-xs text-fg-muted">{label}{ok && <span className="text-success"> ✓</span>}</label>
        <Input name="price" type="number" min="0" defaultValue={price} className="h-9" dir="ltr" />
      </div>
      <select name="unit" defaultValue={unit} className="h-9 rounded-lg border border-border bg-surface-2/60 px-2 text-xs text-fg">
        <option value="WEEKLY">أسبوعي</option>
        <option value="MONTHLY">شهري</option>
      </select>
      <Button type="submit" size="sm" variant="subtle" disabled={pending}>حفظ</Button>
    </form>
  );
}
