"use client";

import { useTransition } from "react";
import { setUserStatus, changeAccountType } from "@/lib/admin-actions";
import { ACCOUNT_TYPES } from "@/lib/rbac";
import { Button } from "@/components/ui/button";

export function UserControls({
  userId,
  status,
  accountType,
  isSelf,
}: {
  userId: string;
  status: string;
  accountType: string;
  isSelf: boolean;
}) {
  const [pending, startTransition] = useTransition();

  if (isSelf) return <span className="text-xs text-fg-faint">حسابك</span>;

  return (
    <div className="flex items-center gap-2">
      <select
        defaultValue={accountType}
        disabled={pending}
        onChange={(e) => startTransition(() => changeAccountType(userId, e.target.value))}
        className="h-9 rounded-lg border border-border bg-surface-2/60 px-2 text-xs text-fg focus:border-primary focus:outline-none"
        title="تغيير نوع الحساب"
      >
        {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      {status === "SUSPENDED" || status === "REJECTED" ? (
        <Button size="sm" variant="subtle" disabled={pending} onClick={() => startTransition(() => setUserStatus(userId, "APPROVED"))}>تفعيل</Button>
      ) : (
        <Button size="sm" variant="outline" disabled={pending} onClick={() => startTransition(() => setUserStatus(userId, "SUSPENDED"))}>تعليق</Button>
      )}
    </div>
  );
}
