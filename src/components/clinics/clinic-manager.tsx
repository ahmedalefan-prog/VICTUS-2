"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveClinic, deleteClinic } from "@/lib/clinic-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Plus, Pencil, Trash2, MapPin, Phone, Stethoscope } from "lucide-react";

export interface ClinicData {
  id: string;
  name: string;
  phone: string;
  address: string;
  governorateId: string;
  governorateName: string;
  deviceCount: number;
  ownerName?: string;
}

export function ClinicManager({
  clinics,
  governorates,
  showOwner,
}: {
  clinics: ClinicData[];
  governorates: { id: string; nameAr: string }[];
  showOwner: boolean;
}) {
  const [editing, setEditing] = useState<ClinicData | null>(null);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> إضافة عيادة
          </Button>
        </div>
        {clinics.length === 0 ? (
          <Card className="py-12 text-center text-fg-muted">لا توجد عيادات بعد — أضف عيادتك الأولى.</Card>
        ) : (
          clinics.map((c) => <ClinicRow key={c.id} clinic={c} showOwner={showOwner} onEdit={() => { setEditing(c); setShowForm(true); }} />)
        )}
      </div>

      {showForm && (
        <ClinicForm key={editing?.id ?? "new"} clinic={editing} governorates={governorates} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function ClinicRow({ clinic, showOwner, onEdit }: { clinic: ClinicData; showOwner: boolean; onEdit: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-fg">{clinic.name}</p>
            <Badge tone="info"><Stethoscope className="ml-1 h-3 w-3" />{clinic.deviceCount} جهاز</Badge>
            {showOwner && clinic.ownerName && <Badge tone="muted">{clinic.ownerName}</Badge>}
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-fg-muted">
            {clinic.governorateName && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{clinic.governorateName}</span>}
            {clinic.phone && <span className="flex items-center gap-1" dir="ltr"><Phone className="h-3 w-3" />{clinic.phone}</span>}
          </div>
          {clinic.address && <p className="mt-1 text-xs text-fg-faint">{clinic.address}</p>}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="danger" disabled={pending}
            onClick={() => {
              if (!confirm(`حذف «${clinic.name}»؟`)) return;
              setError(null);
              startTransition(async () => {
                try { await deleteClinic(clinic.id); router.refresh(); }
                catch (e) { setError(e instanceof Error ? e.message : "تعذّر الحذف"); }
              });
            }}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      {error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </Card>
  );
}

function ClinicForm({ clinic, governorates, onClose }: { clinic: ClinicData | null; governorates: { id: string; nameAr: string }[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="h-fit lg:sticky lg:top-4">
      <h3 className="mb-4 font-semibold text-fg">{clinic ? "تعديل عيادة" : "عيادة جديدة"}</h3>
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            try { await saveClinic(fd); router.refresh(); onClose(); }
            catch (e) { setError(e instanceof Error ? e.message : "تعذّر الحفظ"); }
          })
        }
        className="space-y-3"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        {clinic && <input type="hidden" name="id" value={clinic.id} />}
        <Field label="اسم العيادة"><Input name="name" required defaultValue={clinic?.name ?? ""} /></Field>
        <Field label="المحافظة">
          <Select name="governorateId" defaultValue={clinic?.governorateId ?? ""}>
            <option value="">— غير محدّدة —</option>
            {governorates.map((g) => <option key={g.id} value={g.id}>{g.nameAr}</option>)}
          </Select>
        </Field>
        <Field label="الهاتف"><Input name="phone" dir="ltr" defaultValue={clinic?.phone ?? ""} /></Field>
        <Field label="العنوان"><Textarea name="address" defaultValue={clinic?.address ?? ""} className="min-h-16" /></Field>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={pending}>{pending ? "جارٍ الحفظ…" : "حفظ"}</Button>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </div>
      </form>
    </Card>
  );
}
