import { requirePermission } from "@/lib/guard";
import { can } from "@/lib/rbac";
import { getSettingsByGroup, GROUP_LABELS } from "@/lib/settings";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveSettings } from "./actions";

export const metadata = { title: "إعدادات النظام" };

export default async function SettingsPage() {
  const session = await requirePermission("settings", "VIEW");
  const grouped = await getSettingsByGroup();
  const canManage = can(session.user.permissions, "settings", "MANAGE");

  return (
    <>
      <PageHeader title="إعدادات النظام" description="إعدادات المنصة العامة والوصول ومعلومات الاتصال." />

      <form action={saveSettings} className="space-y-5">
        {Object.entries(grouped).map(([group, rows]) => (
          <Card key={group}>
            <h3 className="mb-4 font-semibold text-fg">{GROUP_LABELS[group] ?? group}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {rows.map((s) => {
                const isBool = typeof s.value === "boolean";
                return (
                  <div key={s.key} className="flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-fg-muted">{s.label}</label>
                    {isBool ? (
                      <select name={s.key} defaultValue={String(s.value)} disabled={!canManage}
                        className="h-11 rounded-lg border border-border bg-surface-2/60 px-3 text-sm text-fg focus:border-primary focus:outline-none">
                        <option value="true">مفعّل</option>
                        <option value="false">معطّل</option>
                      </select>
                    ) : (
                      <Input name={s.key} defaultValue={String(s.value ?? "")} disabled={!canManage}
                        dir={s.key.includes("email") || s.key.includes("phone") ? "ltr" : "rtl"} />
                    )}
                    <span className="text-[11px] text-fg-faint" dir="ltr">{s.key}</span>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}

        {canManage && (
          <div className="flex justify-start">
            <Button type="submit">حفظ الإعدادات</Button>
          </div>
        )}
      </form>
    </>
  );
}
