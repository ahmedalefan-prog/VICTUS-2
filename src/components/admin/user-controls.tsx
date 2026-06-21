"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserStatus, changeAccountType } from "@/lib/admin-actions";
import { ACCOUNT_TYPES } from "@/lib/rbac";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { SelectDropdown } from "@/components/ui/dropdown";
import { toast } from "@/hooks/use-toast";

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
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showSuspend, setShowSuspend] = useState(false);

  if (isSelf) return <span className="text-xs text-fg-faint">حسابك</span>;

  function run(fn: () => Promise<void>, successMsg: string) {
    startTransition(async () => {
      try {
        await fn();
        toast({ title: successMsg, variant: "success" });
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "فشلت العملية";
        toast({ title: "خطأ", description: msg, variant: "error" });
      }
    });
  }

  const isSuspendedOrRejected = status === "SUSPENDED" || status === "REJECTED";

  return (
    <>
      <div className="flex items-center gap-2">
        <SelectDropdown
          value={accountType}
          onChange={(v) => run(() => changeAccountType(userId, v), "تم تغيير نوع الحساب")}
          options={ACCOUNT_TYPES.map((t) => ({ label: t.label, value: t.value }))}
          placeholder="نوع الحساب"
          className="w-36"
        />

        {isSuspendedOrRejected ? (
          <Button size="sm" variant="subtle" disabled={pending}
            onClick={() => run(() => setUserStatus(userId, "APPROVED"), "تم تفعيل الحساب")}>
            تفعيل
          </Button>
        ) : (
          <Button size="sm" variant="outline" disabled={pending}
            onClick={() => setShowSuspend(true)}>
            تعليق
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={showSuspend}
        onClose={() => setShowSuspend(false)}
        onConfirm={() => {
          run(() => setUserStatus(userId, "SUSPENDED"), "تم تعليق الحساب");
          setShowSuspend(false);
        }}
        title="تعليق الحساب"
        description="هل أنت متأكد من تعليق هذا الحساب؟ لن يتمكن المستخدم من الدخول إلى المنصة."
        confirmLabel="تعليق"
        variant="danger"
        loading={pending}
      />
    </>
  );
}
