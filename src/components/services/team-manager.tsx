"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addServiceMember, removeServiceMember, setMemberRole } from "@/lib/team-actions";
import { SERVICE_ROLE_META } from "@/lib/services-meta";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { Trash2 } from "lucide-react";

export interface MemberRow {
  id: string;
  name: string;
  email: string;
  role: string;
  isSelf: boolean;
}

export function TeamManager({ members, canManage }: { members: MemberRow[]; canManage: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<void>) {
    setError(null);
    startTransition(async () => {
      try { await fn(); router.refresh(); }
      catch (e) { setError(e instanceof Error ? e.message : "تعذّر تنفيذ العملية"); }
    });
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {error && <p className="text-sm text-danger">{error}</p>}
        {members.map((m) => (
          <Card key={m.id} className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium text-fg">{m.name}{m.isSelf && <span className="mr-1 text-xs text-fg-faint">(أنت)</span>}</p>
              <p className="text-xs text-fg-muted" dir="ltr">{m.email}</p>
            </div>
            <div className="flex items-center gap-2">
              {canManage && !m.isSelf ? (
                <Select className="h-9 w-28" defaultValue={m.role} disabled={pending} onChange={(e) => run(() => setMemberRole(m.id, e.target.value))}>
                  {Object.entries(SERVICE_ROLE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </Select>
              ) : (
                <Badge tone={SERVICE_ROLE_META[m.role]?.tone ?? "muted"}>{SERVICE_ROLE_META[m.role]?.label}</Badge>
              )}
              {canManage && !m.isSelf && (
                <Button size="sm" variant="danger" disabled={pending}
                  onClick={() => { if (!confirm(`إزالة ${m.name}؟`)) return; run(() => removeServiceMember(m.id)); }}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>

      {canManage && (
        <Card className="h-fit">
          <h3 className="mb-4 font-semibold text-fg">إضافة عضو</h3>
          <form action={(fd) => run(async () => { await addServiceMember(fd); })} className="space-y-3">
            <Field label="بريد العضو" hint="يجب أن يملك حساباً"><Input name="email" type="email" dir="ltr" required placeholder="member@victus.iq" /></Field>
            <Field label="الدور">
              <Select name="role" defaultValue="MEMBER">
                {Object.entries(SERVICE_ROLE_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </Select>
            </Field>
            <Button type="submit" className="w-full" disabled={pending}>إضافة</Button>
          </form>
        </Card>
      )}
    </div>
  );
}
