"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setFulfillmentStatus, cancelOrder } from "@/lib/order-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try {
        await fn();
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر تنفيذ العملية");
      }
    });
  }

  const transitions = props.allowedTransitions.filter((s) => s !== "CANCELLED");

  return (
    <Card>
      <h3 className="mb-3 font-semibold text-fg">الإجراءات</h3>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}

      {!props.closed && (
        props.isMember ? (
          transitions.length > 0 ? (
            <div className="space-y-2">
              <p className="text-xs text-fg-muted">نقل الحالة إلى:</p>
              {transitions.map((s) => (
                <Button key={s} className="w-full" disabled={pending} onClick={() => run(() => setFulfillmentStatus(props.orderId, s))}>
                  {props.fulfillmentLabels[s]}
                </Button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-fg-muted">لا توجد انتقالات تالية.</p>
          )
        ) : (
          <p className="text-sm text-fg-muted">يتولّى فريق الخدمة التنفيذ. يمكنك متابعة الحالة هنا.</p>
        )
      )}

      {!props.closed && (
        <Button variant="danger" className="mt-3 w-full" disabled={pending}
          onClick={() => {
            if (!confirm("تأكيد إلغاء الطلب؟")) return;
            const reason = prompt("سبب الإلغاء (اختياري)") ?? undefined;
            run(() => cancelOrder(props.orderId, reason));
          }}>
          إلغاء الطلب
        </Button>
      )}

      {props.closed && <p className="text-sm text-fg-muted">هذا الطلب مُغلق.</p>}
    </Card>
  );
}
