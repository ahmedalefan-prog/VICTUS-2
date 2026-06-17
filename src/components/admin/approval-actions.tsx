"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { approveUser, rejectUser } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";

export function ApprovalActions({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  if (rejecting) {
    return (
      <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="سبب الرفض (اختياري)"
          className="h-9 flex-1 rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-fg placeholder:text-fg-faint focus:border-primary focus:outline-none" />
        <Button variant="danger" size="sm" disabled={pending} onClick={() => startTransition(() => rejectUser(userId, note))}>تأكيد الرفض</Button>
        <Button variant="ghost" size="sm" onClick={() => setRejecting(false)}>إلغاء</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button size="sm" disabled={pending} onClick={() => startTransition(() => approveUser(userId))} className="gap-1.5">
        <Check className="h-4 w-4" /> موافقة
      </Button>
      <Button variant="outline" size="sm" onClick={() => setRejecting(true)} className="gap-1.5">
        <X className="h-4 w-4" /> رفض
      </Button>
    </div>
  );
}
