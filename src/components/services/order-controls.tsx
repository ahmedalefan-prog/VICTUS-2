"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { negotiationAction, setFulfillmentStatus, cancelOrder } from "@/lib/order-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";

interface ThreadEvent {
  id: string;
  actorName: string;
  action: string;
  price: string | null;
  note: string;
  at: string;
  mine: boolean;
}

export function NegotiationThread({ events }: { events: ThreadEvent[] }) {
  return (
    <ul className="space-y-2">
      {events.map((e) => (
        <li key={e.id} className={`rounded-lg border p-3 text-sm ${e.mine ? "border-primary/30 bg-primary-soft/40" : "border-border-soft bg-surface-2/40"}`}>
          <div className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-2">
              <span className="font-medium text-fg">{e.actorName}</span>
              <Badge tone="muted">{e.action}</Badge>
            </span>
            {e.price && <span className="font-medium text-fg">{e.price}</span>}
          </div>
          {e.note && <p className="mt-1 text-xs text-fg-muted">{e.note}</p>}
          <p className="mt-1 text-[11px] text-fg-faint">{e.at}</p>
        </li>
      ))}
    </ul>
  );
}

export function OrderControls(props: {
  orderId: string;
  isMember: boolean;
  negotiating: boolean;
  agreed: boolean;
  closed: boolean;
  currentProposed: number | null;
  currentProposedLabel: string | null;
  iProposedLast: boolean;
  allowedTransitions: string[];
  fulfillmentLabels: Record<string, string>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [counter, setCounter] = useState("");

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

  return (
    <Card>
      <h3 className="mb-3 font-semibold text-fg">الإجراءات</h3>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}

      {props.negotiating && (
        <div className="space-y-3">
          {props.currentProposedLabel && (
            <div className="flex items-center justify-between rounded-lg bg-surface-2/50 p-2.5 text-sm">
              <span className="text-fg-muted">السعر المطروح حالياً</span>
              <span className="font-bold text-fg">{props.currentProposedLabel}</span>
            </div>
          )}

          {!props.iProposedLast && props.currentProposed !== null && (
            <Button className="w-full" disabled={pending} onClick={() => run(() => negotiationAction({ orderId: props.orderId, action: "ACCEPT" }))}>
              قبول السعر المطروح
            </Button>
          )}

          <Field label="عرض مضاد (إجمالي IQD)">
            <div className="flex gap-2">
              <Input type="number" min="0" step="any" dir="ltr" value={counter} onChange={(e) => setCounter(e.target.value)} placeholder="السعر المضاد" />
              <Button variant="outline" disabled={pending || !counter || Number(counter) <= 0}
                onClick={() => run(async () => { await negotiationAction({ orderId: props.orderId, action: "COUNTER", price: Number(counter) }); setCounter(""); })}>
                أرسل
              </Button>
            </div>
          </Field>

          <Button variant="ghost" className="w-full text-danger" disabled={pending}
            onClick={() => run(() => negotiationAction({ orderId: props.orderId, action: "REJECT" }))}>
            رفض التفاوض
          </Button>
        </div>
      )}

      {props.agreed && !props.closed && (
        <div className="space-y-3">
          {props.isMember ? (
            props.allowedTransitions.filter((s) => s !== "CANCELLED").length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs text-fg-muted">نقل الحالة إلى:</p>
                {props.allowedTransitions.filter((s) => s !== "CANCELLED").map((s) => (
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
          )}
        </div>
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
