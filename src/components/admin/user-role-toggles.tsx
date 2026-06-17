"use client";

import { useState, useTransition } from "react";
import { toggleUserRole } from "@/lib/admin-actions";
import { Badge } from "@/components/ui/badge";

export function UserRoleToggles({
  userId,
  roles,
  assigned,
  canEdit,
}: {
  userId: string;
  roles: { id: string; name: string; key: string }[];
  assigned: string[];
  canEdit: boolean;
}) {
  const [set, setSet] = useState<Set<string>>(() => new Set(assigned));
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle(roleId: string) {
    if (!canEdit) return;
    const enabled = !set.has(roleId);
    setSet((prev) => { const n = new Set(prev); if (enabled) n.add(roleId); else n.delete(roleId); return n; });
    startTransition(async () => {
      setError(null);
      try { await toggleUserRole(userId, roleId, enabled); }
      catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر");
        setSet((prev) => { const n = new Set(prev); if (enabled) n.delete(roleId); else n.add(roleId); return n; });
      }
    });
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {roles.map((r) => {
          const on = set.has(r.id);
          return (
            <button key={r.id} type="button" disabled={!canEdit || pending} onClick={() => toggle(r.id)} title={r.key}
              className={`rounded-lg border px-3 py-1.5 text-sm transition disabled:opacity-60 ${on ? "border-primary bg-primary-soft text-primary" : "border-border-soft bg-surface-2/40 text-fg-muted hover:text-fg"}`}>
              {r.name}
            </button>
          );
        })}
      </div>
      {error && <p className="mt-2 text-xs text-danger">{error}</p>}
      {!canEdit && <Badge tone="muted" className="mt-2">للعرض فقط</Badge>}
    </div>
  );
}
