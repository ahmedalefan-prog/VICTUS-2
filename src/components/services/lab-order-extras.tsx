"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rateLabOrder } from "@/lib/order-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Odontogram } from "@/components/services/odontogram";
import { Star } from "lucide-react";

export const ORDER_PALETTE = ["#2dd4bf", "#f59e0b", "#a78bfa", "#f472b6", "#60a5fa", "#34d399", "#fb923c", "#e879f9"];

// Read-only multi-colour odontogram of a saved order + legend.
export function OrderOdontogram({ items }: { items: { name: string; teeth: number[] }[] }) {
  const assignments: Record<number, string> = {};
  items.forEach((it, i) => {
    const c = ORDER_PALETTE[i % ORDER_PALETTE.length];
    for (const t of it.teeth) assignments[t] = c;
  });
  if (Object.keys(assignments).length === 0) return null;
  return (
    <div>
      <div className="mb-3 flex flex-wrap gap-2">
        {items.filter((it) => it.teeth.length > 0).map((it, i) => (
          <span key={i} className="flex items-center gap-1.5 rounded-full border border-border-soft px-2.5 py-1 text-xs">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: ORDER_PALETTE[i % ORDER_PALETTE.length] }} />
            {it.name} ({it.teeth.length})
          </span>
        ))}
      </div>
      <Odontogram assignments={assignments} disabled />
    </div>
  );
}

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)}>
          <Star className={`h-6 w-6 ${n <= value ? "fill-warning text-warning" : "text-fg-faint"}`} />
        </button>
      ))}
    </div>
  );
}

export function RatingForm({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [quality, setQuality] = useState(5);
  const [speed, setSpeed] = useState(5);
  const [commitment, setCommitment] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    startTransition(async () => {
      try {
        await rateLabOrder({ orderId, quality, speed, commitment, comment: comment || undefined });
        router.refresh();
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر إرسال التقييم");
      }
    });
  }

  return (
    <Card>
      <h3 className="mb-3 font-semibold text-fg">قيّم المختبر</h3>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}
      <div className="space-y-3 text-sm">
        <div className="flex items-center justify-between"><span className="text-fg-muted">الجودة</span><Stars value={quality} onChange={setQuality} /></div>
        <div className="flex items-center justify-between"><span className="text-fg-muted">السرعة</span><Stars value={speed} onChange={setSpeed} /></div>
        <div className="flex items-center justify-between"><span className="text-fg-muted">الالتزام</span><Stars value={commitment} onChange={setCommitment} /></div>
        <Input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="تعليق (اختياري)" />
        <Button className="w-full" disabled={pending} onClick={submit}>{pending ? "جارٍ الإرسال…" : "إرسال التقييم"}</Button>
      </div>
    </Card>
  );
}

export function RatingDisplay({ quality, speed, commitment, comment }: { quality: number; speed: number; commitment: number; comment: string | null }) {
  const avg = ((quality + speed + commitment) / 3).toFixed(1);
  return (
    <Card>
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-semibold text-fg">تقييمك للمختبر</h3>
        <Badge tone="warning">{avg} / 5</Badge>
      </div>
      <div className="space-y-1 text-sm text-fg-muted">
        <div className="flex justify-between"><span>الجودة</span><span className="text-fg">{quality}/5</span></div>
        <div className="flex justify-between"><span>السرعة</span><span className="text-fg">{speed}/5</span></div>
        <div className="flex justify-between"><span>الالتزام</span><span className="text-fg">{commitment}/5</span></div>
        {comment && <p className="mt-2 border-t border-border-soft pt-2 text-xs">{comment}</p>}
      </div>
    </Card>
  );
}
