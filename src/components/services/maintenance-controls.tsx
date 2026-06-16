"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  assignEngineer,
  startWork,
  addVisit,
  addPart,
  removePart,
  saveReport,
  acknowledgeCost,
  completeRequest,
  cancelRequest,
} from "@/lib/maintenance-actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

interface Props {
  requestId: string;
  status: string;
  isRequester: boolean;
  isMember: boolean;
  canAct: boolean;
  acknowledged: boolean;
  hasReport: boolean;
  totalCostLabel: string | null;
  assignedEngineerId: string | null;
  engineers: { id: string; name: string }[];
  marketItems: { id: string; name: string; price: string }[];
  parts: { id: string; label: string }[];
  report: { diagnosis: string; laborCost: number } | null;
}

const OPEN = ["NEW", "ASSIGNED", "IN_PROGRESS", "AWAITING_CLOSURE"];

export function MaintenanceControls(props: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // local form state
  const [engineer, setEngineer] = useState(props.assignedEngineerId ?? "");
  const [visitDate, setVisitDate] = useState("");
  const [visitNotes, setVisitNotes] = useState("");
  const [partItem, setPartItem] = useState("");
  const [partQty, setPartQty] = useState("1");
  const [diagnosis, setDiagnosis] = useState(props.report?.diagnosis ?? "");
  const [labor, setLabor] = useState(props.report ? String(props.report.laborCost) : "");

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

  const open = OPEN.includes(props.status);
  const working = props.canAct && ["IN_PROGRESS", "AWAITING_CLOSURE"].includes(props.status);

  return (
    <Card>
      <h3 className="mb-3 font-semibold text-fg">الإجراءات</h3>
      {error && <p className="mb-2 text-sm text-danger">{error}</p>}

      {/* ── Team: assign an engineer (NEW / ASSIGNED) ── */}
      {props.isMember && ["NEW", "ASSIGNED"].includes(props.status) && (
        <div className="mb-4 space-y-2 border-b border-border-soft pb-4">
          <Field label="إسناد مهندس">
            <Select value={engineer} onChange={(e) => setEngineer(e.target.value)}>
              <option value="">— اختر مهندساً —</option>
              {props.engineers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </Select>
          </Field>
          <Button className="w-full" disabled={pending || !engineer} onClick={() => run(() => assignEngineer(props.requestId, engineer))}>
            {props.status === "ASSIGNED" ? "إعادة الإسناد" : "إسناد"}
          </Button>
        </div>
      )}

      {/* ── Engineer: start work (ASSIGNED) ── */}
      {props.canAct && props.status === "ASSIGNED" && (
        <Button className="mb-4 w-full" disabled={pending} onClick={() => run(() => startWork(props.requestId))}>
          بدء التنفيذ
        </Button>
      )}

      {/* ── Engineer workspace: visits + parts + report (IN_PROGRESS / AWAITING_CLOSURE) ── */}
      {working && (
        <div className="space-y-5">
          <div className="space-y-2">
            <p className="text-xs font-medium text-fg-muted">تسجيل زيارة</p>
            <Input type="date" dir="ltr" value={visitDate} onChange={(e) => setVisitDate(e.target.value)} />
            <Input value={visitNotes} onChange={(e) => setVisitNotes(e.target.value)} placeholder="ملاحظات الزيارة (اختياري)" maxLength={1000} />
            <Button variant="outline" className="w-full" disabled={pending || !visitDate}
              onClick={() => run(async () => { await addVisit({ requestId: props.requestId, visitDate, notes: visitNotes || undefined }); setVisitDate(""); setVisitNotes(""); })}>
              إضافة زيارة
            </Button>
          </div>

          <div className="space-y-2 border-t border-border-soft pt-4">
            <p className="text-xs font-medium text-fg-muted">ربط قطعة غيار من السوق</p>
            <Select value={partItem} onChange={(e) => setPartItem(e.target.value)}>
              <option value="">— اختر قطعة —</option>
              {props.marketItems.map((m) => (
                <option key={m.id} value={m.id}>{m.name} · {m.price}</option>
              ))}
            </Select>
            <div className="flex gap-2">
              <Input type="number" min="1" step="1" dir="ltr" value={partQty} onChange={(e) => setPartQty(e.target.value)} className="w-24" />
              <Button variant="outline" className="flex-1" disabled={pending || !partItem || Number(partQty) < 1}
                onClick={() => run(async () => { await addPart(props.requestId, partItem, Number(partQty)); setPartItem(""); setPartQty("1"); })}>
                ربط القطعة
              </Button>
            </div>
            <p className="text-[11px] text-fg-faint">تُحسب ضمن تكلفة الصيانة فقط (دون خصم من مخزون السوق).</p>
            {props.parts.length > 0 && (
              <ul className="space-y-1">
                {props.parts.map((p) => (
                  <li key={p.id} className="flex items-center justify-between rounded-md bg-surface-2/50 px-2.5 py-1.5 text-xs text-fg">
                    <span>{p.label}</span>
                    <button type="button" className="text-fg-faint hover:text-danger" disabled={pending} onClick={() => run(() => removePart(p.id))} aria-label="حذف">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-2 border-t border-border-soft pt-4">
            <p className="text-xs font-medium text-fg-muted">تقرير الصيانة (تشخيص + أجور)</p>
            <Textarea value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="التشخيص والإجراءات المتّخذة…" maxLength={4000} />
            <Field label="الأجور (IQD)">
              <Input type="number" min="0" step="any" dir="ltr" value={labor} onChange={(e) => setLabor(e.target.value)} placeholder="0" />
            </Field>
            <Button className="w-full" disabled={pending || diagnosis.trim().length < 3}
              onClick={() => run(() => saveReport({ requestId: props.requestId, diagnosis, laborCost: Number(labor) || 0 }))}>
              {props.hasReport ? "تحديث التقرير" : "حفظ التقرير وإرساله للعميل"}
            </Button>
            <p className="text-[11px] text-fg-faint">قطع الغيار تُجمَع تلقائياً. الإجمالي = الأجور + القطع.</p>
          </div>
        </div>
      )}

      {/* ── Doctor: acknowledge cost (transparency only) ── */}
      {props.isRequester && props.status === "AWAITING_CLOSURE" && (
        <div className="space-y-2">
          {props.totalCostLabel && (
            <div className="flex items-center justify-between rounded-lg bg-surface-2/50 p-2.5 text-sm">
              <span className="text-fg-muted">التكلفة الإجمالية</span>
              <span className="font-bold text-fg">{props.totalCostLabel}</span>
            </div>
          )}
          {props.acknowledged ? (
            <p className="text-sm text-success">أقررتَ بالتكلفة — بانتظار إنهاء الفريق.</p>
          ) : (
            <Button className="w-full" disabled={pending} onClick={() => run(() => acknowledgeCost(props.requestId))}>
              أُقرّ بالتكلفة
            </Button>
          )}
          <p className="text-[11px] text-fg-faint">إقرار شفافية للاطّلاع على التكلفة قبل الإنهاء.</p>
        </div>
      )}

      {/* ── Team: finalise after acknowledgement ── */}
      {props.canAct && props.status === "AWAITING_CLOSURE" && (
        <div className="mt-3 space-y-1 border-t border-border-soft pt-3">
          <Button className="w-full" disabled={pending || !props.acknowledged} onClick={() => run(() => completeRequest(props.requestId))}>
            إنهاء الطلب (توثيق المعاملة)
          </Button>
          {!props.acknowledged && <p className="text-[11px] text-fg-faint">بانتظار إقرار العميل بالتكلفة.</p>}
        </div>
      )}

      {/* ── Cancel (requester or team, any open state) ── */}
      {open && (props.isRequester || props.isMember) && (
        <Button variant="danger" className="mt-3 w-full" disabled={pending}
          onClick={() => {
            if (!confirm("تأكيد إلغاء الطلب؟")) return;
            const reason = prompt("سبب الإلغاء (اختياري)") ?? undefined;
            run(() => cancelRequest(props.requestId, reason));
          }}>
          إلغاء الطلب
        </Button>
      )}

      {!open && <p className="mt-1 text-sm text-fg-muted">هذا الطلب مُغلق.</p>}
    </Card>
  );
}
