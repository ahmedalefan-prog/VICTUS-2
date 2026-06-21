"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFulfillmentStatus, cancelOrder } from "@/lib/order-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input, Field } from "@/components/ui/input";
import { ConfirmDialog } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

export function OrderControls(props: {
  orderId: string;
  isMember: boolean;
  closed: boolean;
  allowedTransitions: string[];
  fulfillmentLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showCancel, setShowCancel] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  function run(fn: () => Promise<void>, successMsg?: string) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        toast({ title: successMsg ?? "تمت العملية", variant: "success" });
        router.refresh();
      } catch (e) {
        const msg = e instanceof Error ? e.message : "تعذّر تنفيذ العملية";
        setError(msg);
        toast({ title: "خطأ", description: msg, variant: "error" });
      }
    });
  }

  const transitions = props.allowedTransitions.filter((s) => s !== "CANCELLED");

  return (
    <>
      <Card>
        <h3 className="mb-3 font-semibold text-fg">الإجراءات</h3>
        {error && <p className="mb-2 text-sm text-danger">{error}</p>}

        {!props.closed ? (
          props.isMember ? (
            transitions.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-fg-muted">نقل الحالة إلى:</p>
                {transitions.map((s) => (
                  <Button
                    key={s}
                    className="w-full"
                    disabled={pending}
                    onClick={() =>
                      run(
                        () => setFulfillmentStatus(props.orderId, s),
                        `الطلب ← ${props.fulfillmentLabels[s]}`,
                      )
                    }
                  >
                    {props.fulfillmentLabels[s]}
                  </Button>
                ))}
              </div>
            ) : (
              <EmptyState title="لا توجد انتقالات تالية." />
            )
          ) : (
            <p className="text-sm text-fg-muted">
              يتولّى فريق الخدمة التنفيذ. يمكنك متابعة الحالة هنا.
            </p>
          )
        ) : (
          <p className="text-sm text-fg-muted">هذا الطلب مُغلق.</p>
        )}

        {!props.closed && (
          <Button
            variant="danger"
            className="mt-3 w-full"
            disabled={pending}
            onClick={() => setShowCancel(true)}
          >
            إلغاء الطلب
          </Button>
        )}
      </Card>

      <ConfirmDialog
        open={showCancel}
        onClose={() => setShowCancel(false)}
        onConfirm={() => {
          run(
            () => cancelOrder(props.orderId, cancelReason || undefined),
            "تم إلغاء الطلب",
          );
          setShowCancel(false);
        }}
        title="تأكيد إلغاء الطلب"
        description="هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن هذا الإجراء."
        confirmLabel="تأكيد الإلغاء"
        variant="danger"
        loading={pending}
      />

      {/* Cancel reason input as a small inline addition */}
      {showCancel && (
        <div className="mt-3 rounded-xl border border-danger/20 bg-danger/5 p-3">
          <Field label="سبب الإلغاء (اختياري)">
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="سبب الإلغاء..."
              autoFocus
            />
          </Field>
        </div>
      )}
    </>
  );
}
