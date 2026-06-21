"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, X } from "lucide-react";
import { approveUser, rejectUser } from "@/lib/admin-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export function ApprovalActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [showReject, setShowReject] = useState(false);
  const [note, setNote] = useState("");

  function run(fn: () => Promise<void>, successMsg: string) {
    startTransition(async () => {
      try {
        await fn();
        toast({ title: successMsg, variant: "success" });
        router.refresh();
      } catch (e) {
        toast({
          title: "خطأ",
          description: e instanceof Error ? e.message : "فشلت العملية",
          variant: "error",
        });
      }
    });
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          disabled={pending}
          onClick={() => run(() => approveUser(userId), "تم قبول الحساب")}
          className="gap-1.5"
        >
          <Check className="h-4 w-4" /> موافقة
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowReject(true)}
          className="gap-1.5"
        >
          <X className="h-4 w-4" /> رفض
        </Button>
      </div>

      <ConfirmDialog
        open={showReject}
        onClose={() => setShowReject(false)}
        onConfirm={() => {
          run(() => rejectUser(userId, note), "تم رفض الحساب");
          setShowReject(false);
          setNote("");
        }}
        title="رفض الحساب"
        description="هل أنت متأكد من رفض هذا الحساب؟"
        confirmLabel="رفض"
        variant="danger"
        loading={pending}
      >
        <div className="mt-3">
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="سبب الرفض (اختياري)"
            className="w-full"
          />
        </div>
      </ConfirmDialog>
    </>
  );
}
