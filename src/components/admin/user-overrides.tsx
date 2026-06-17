"use client";

import { useState, useTransition } from "react";
import { Check, X, Minus } from "lucide-react";
import { setUserOverride } from "@/lib/permission-actions";
import { RESOURCES, PERMISSION_ACTIONS } from "@/lib/rbac";
import { Card } from "@/components/ui/card";

const ACTION_LABELS: Record<string, string> = {
  VIEW: "عرض", CREATE: "إنشاء", EDIT: "تعديل", DELETE: "حذف", MANAGE: "إدارة", EXPORT: "تصدير",
};
type State = "inherit" | "grant" | "revoke";
const NEXT: Record<State, State> = { inherit: "grant", grant: "revoke", revoke: "inherit" };

export function UserOverrides({
  userId, rolePerms, overrides, canEdit,
}: {
  userId: string; rolePerms: string[]; overrides: Record<string, boolean>; canEdit: boolean;
}) {
  const roleSet = new Set(rolePerms);
  const [ov, setOv] = useState<Record<string, boolean>>(overrides);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function stateOf(key: string): State {
    if (key in ov) return ov[key] ? "grant" : "revoke";
    return "inherit";
  }
  function cycle(resource: string, action: string) {
    if (!canEdit) return;
    const key = `${resource}:${action}`;
    const next = NEXT[stateOf(key)];
    const prevOv = ov;
    setOv((o) => { const n = { ...o }; if (next === "inherit") delete n[key]; else n[key] = next === "grant"; return n; });
    startTransition(async () => {
      setError(null);
      try { await setUserOverride(userId, resource, action, next); }
      catch (e) { setError(e instanceof Error ? e.message : "تعذّر"); setOv(prevOv); }
    });
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-soft p-4 text-xs">
        <span className="font-semibold text-fg">مصفوفة الصلاحيات (تجاوزات هذا المستخدم فوق دوره)</span>
        <span className="flex flex-wrap items-center gap-3 text-fg-faint">
          {error && <span className="text-danger">{error}</span>}
          <span className="flex items-center gap-1"><Check className="h-3.5 w-3.5 text-success" /> موروث من الدور</span>
          <span className="flex items-center gap-1"><span className="flex h-4 w-4 items-center justify-center rounded bg-primary text-white"><Check className="h-3 w-3" /></span> مَمنوح</span>
          <span className="flex items-center gap-1"><span className="flex h-4 w-4 items-center justify-center rounded bg-danger text-white"><X className="h-3 w-3" /></span> مسحوب</span>
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-fg-faint">
              <th className="px-4 py-2 text-right font-medium">القسم</th>
              {PERMISSION_ACTIONS.map((a) => <th key={a} className="px-2 py-2 text-center font-medium">{ACTION_LABELS[a]}</th>)}
            </tr>
          </thead>
          <tbody>
            {RESOURCES.map((r) => (
              <tr key={r.key} className="border-t border-border-soft/50">
                <td className="px-4 py-1.5 text-fg-muted">{r.label}<span className="mr-1 text-fg-faint/50" dir="ltr">{r.key}</span></td>
                {PERMISSION_ACTIONS.map((a) => {
                  const key = `${r.key}:${a}`;
                  const st = stateOf(key);
                  const roleHas = roleSet.has(key);
                  const effective = st === "grant" || (st === "inherit" && roleHas);
                  return (
                    <td key={a} className="px-2 py-1.5 text-center">
                      <button type="button" disabled={!canEdit || pending} onClick={() => cycle(r.key, a)}
                        title={`${r.key}.${a} — ${st === "inherit" ? "موروث" : st === "grant" ? "ممنوح" : "مسحوب"} (الفعلي: ${effective ? "مسموح" : "ممنوع"})`}
                        className={`mx-auto flex h-5 w-5 items-center justify-center rounded border transition disabled:opacity-60 ${
                          st === "grant" ? "border-primary bg-primary text-white"
                          : st === "revoke" ? "border-danger bg-danger text-white"
                          : roleHas ? "border-success/40 bg-success/10 text-success"
                          : "border-border bg-surface-2 text-fg-faint/40"
                        }`}>
                        {st === "grant" ? <Check className="h-3.5 w-3.5" /> : st === "revoke" ? <X className="h-3.5 w-3.5" /> : roleHas ? <Check className="h-3 w-3" /> : <Minus className="h-3 w-3" />}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
