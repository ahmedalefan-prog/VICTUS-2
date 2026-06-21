"use client";

import { useState, useTransition } from "react";
import { Check, Lock } from "lucide-react";
import { setRolePermission } from "@/lib/permission-actions";
import { RESOURCES, PERMISSION_ACTIONS } from "@/lib/rbac";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const ACTION_LABELS: Record<string, string> = {
  VIEW: "عرض", CREATE: "إنشاء", EDIT: "تعديل", DELETE: "حذف", MANAGE: "إدارة", EXPORT: "تصدير",
};

export function RoleMatrix({
  roleId, roleKey, roleName, isSystem, userCount, perms, canEdit,
}: {
  roleId: string; roleKey: string; roleName: string; isSystem: boolean; userCount: number; perms: string[]; canEdit: boolean;
}) {
  const [set, setSet] = useState<Set<string>>(() => new Set(perms));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const locked = !canEdit || roleKey === "super_admin";

  function toggle(resource: string, action: string) {
    if (locked) return;
    const key = `${resource}:${action}`;
    const enabled = !set.has(key);
    setSet((prev) => { const n = new Set(prev); if (enabled) n.add(key); else n.delete(key); return n; });
    startTransition(async () => {
      setError(null);
      try { await setRolePermission(roleId, resource, action, enabled); }
      catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر");
        setSet((prev) => { const n = new Set(prev); if (enabled) n.delete(key); else n.add(key); return n; });
      }
    });
  }

  return (
    <Card className="overflow-hidden p-0 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-[0_4px_20px_-8px_var(--primary)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-soft p-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-fg">{roleName}</h3>
            {isSystem && <Badge tone="info">دور نظام</Badge>}
            {locked && <Badge tone="muted"><Lock className="h-3 w-3" /> {roleKey === "super_admin" ? "محمي" : "للعرض"}</Badge>}
          </div>
          <p className="mt-0.5 text-xs text-fg-faint" dir="ltr">{roleKey}</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-fg-muted">
          {error && <span className="text-danger">{error}</span>}
          <Badge tone="primary">{set.size} صلاحية</Badge>
          <Badge tone="muted">{userCount} مستخدم</Badge>
        </div>
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
              <tr key={r.key} className="border-t border-border-soft/50 transition-colors hover:bg-surface-2/30">
                <td className="px-4 py-1.5 text-fg-muted">{r.label}<span className="mr-1 text-fg-faint/50" dir="ltr">{r.key}</span></td>
                {PERMISSION_ACTIONS.map((a) => {
                  const has = set.has(`${r.key}:${a}`);
                  return (
                    <td key={a} className="px-2 py-1.5 text-center">
                      {locked ? (
                        has ? <Check className="mx-auto h-4 w-4 text-primary" /> : <span className="text-fg-faint/40">·</span>
                      ) : (
                        <button type="button" disabled={pending} onClick={() => toggle(r.key, a)} aria-pressed={has} title={`${r.key}.${a}`}
                          className={`mx-auto flex h-5 w-5 items-center justify-center rounded border transition disabled:opacity-50 ${has ? "border-primary bg-primary text-white" : "border-border bg-surface-2 text-transparent hover:border-primary/50"}`}>
                          <Check className="h-3.5 w-3.5" />
                        </button>
                      )}
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
