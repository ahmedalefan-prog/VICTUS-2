import type { LucideIcon } from "lucide-react";
import { Construction } from "lucide-react";
import { PageHeader } from "@/components/layout/dashboard-shell";

// Organized placeholder for modules that are scaffolded but not yet implemented.
export function ModulePlaceholder({
  title,
  description,
  icon: Icon = Construction,
  features = [],
  phase,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  features?: string[];
  phase?: string;
}) {
  return (
    <>
      <PageHeader title={title} description={description} />
      <div className="card glass rounded-[var(--radius)] p-8">
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-soft text-primary">
            <Icon className="h-8 w-8" />
          </span>
          <h2 className="text-lg font-semibold text-fg">هذا القسم قيد التطوير</h2>
          <p className="mt-2 max-w-md text-sm text-fg-muted">
            تم تجهيز البنية الأساسية وقاعدة البيانات لهذا القسم. سيتم تفعيله ضمن مراحل
            التطوير القادمة دون الحاجة لإعادة بناء النظام.
          </p>
          {phase && (
            <span className="mt-4 rounded-full border border-border bg-surface-2 px-3 py-1 text-xs text-fg-muted">
              {phase}
            </span>
          )}
        </div>

        {features.length > 0 && (
          <div className="mt-6 border-t border-border-soft pt-6">
            <p className="mb-3 text-sm font-semibold text-fg">ما سيتضمنه هذا القسم:</p>
            <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {features.map((f) => (
                <li
                  key={f}
                  className="flex items-center gap-2.5 rounded-lg border border-border-soft bg-surface-2/40 px-3 py-2.5 text-sm text-fg-muted"
                >
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </>
  );
}
