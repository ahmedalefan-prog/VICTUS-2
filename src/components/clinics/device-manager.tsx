"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveDevice, deleteDevice } from "@/lib/clinic-actions";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { Plus, Pencil, Trash2, ShieldCheck } from "lucide-react";

export interface DeviceData {
  id: string;
  clinicId: string;
  clinicName: string;
  name: string;
  brand: string;
  model: string;
  serial: string;
  warrantyEnd: string; // ISO yyyy-mm-dd or ""
  warrantyLabel: string; // formatted or ""
}

export function DeviceManager({
  devices,
  clinics,
}: {
  devices: DeviceData[];
  clinics: { id: string; name: string }[];
}) {
  const [editing, setEditing] = useState<DeviceData | null>(null);
  const [showForm, setShowForm] = useState(false);

  if (clinics.length === 0) {
    return <Card className="py-12 text-center text-fg-muted">أضِف عيادة أولاً من صفحة العيادات قبل تسجيل الأجهزة.</Card>;
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        <div className="flex justify-end">
          <Button size="sm" onClick={() => { setEditing(null); setShowForm(true); }}>
            <Plus className="h-4 w-4" /> إضافة جهاز
          </Button>
        </div>
        {devices.length === 0 ? (
          <Card className="py-12 text-center text-fg-muted">لا توجد أجهزة بعد.</Card>
        ) : (
          devices.map((d) => <DeviceRow key={d.id} device={d} onEdit={() => { setEditing(d); setShowForm(true); }} />)
        )}
      </div>

      {showForm && (
        <DeviceForm key={editing?.id ?? "new"} device={editing} clinics={clinics} onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

function DeviceRow({ device, onEdit }: { device: DeviceData; onEdit: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const expired = device.warrantyEnd ? new Date(device.warrantyEnd) < new Date() : false;

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <p className="font-semibold text-fg">{device.name}</p>
            <Badge tone="muted">{device.clinicName}</Badge>
          </div>
          <div className="mt-1 text-xs text-fg-muted">
            {[device.brand, device.model].filter(Boolean).join(" · ")}
            {device.serial && <span className="text-fg-faint"> — S/N {device.serial}</span>}
          </div>
          {device.warrantyLabel && (
            <Badge tone={expired ? "danger" : "success"} className="mt-1.5">
              <ShieldCheck className="ml-1 h-3 w-3" />{expired ? "انتهى الضمان" : "ضمان حتى"} {device.warrantyLabel}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={onEdit}><Pencil className="h-3.5 w-3.5" /></Button>
          <Button size="sm" variant="danger" disabled={pending}
            onClick={() => {
              if (!confirm(`حذف «${device.name}»؟`)) return;
              setError(null);
              startTransition(async () => {
                try { await deleteDevice(device.id); router.refresh(); }
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

function DeviceForm({ device, clinics, onClose }: { device: DeviceData | null; clinics: { id: string; name: string }[]; onClose: () => void }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <Card className="h-fit lg:sticky lg:top-4">
      <h3 className="mb-4 font-semibold text-fg">{device ? "تعديل جهاز" : "جهاز جديد"}</h3>
      <form
        action={(fd) =>
          startTransition(async () => {
            setError(null);
            try { await saveDevice(fd); router.refresh(); onClose(); }
            catch (e) { setError(e instanceof Error ? e.message : "تعذّر الحفظ"); }
          })
        }
        className="space-y-3"
      >
        {error && <p className="text-sm text-danger">{error}</p>}
        {device && <input type="hidden" name="id" value={device.id} />}
        <Field label="العيادة">
          <Select name="clinicId" required defaultValue={device?.clinicId ?? (clinics.length === 1 ? clinics[0].id : "")}>
            <option value="">— اختر العيادة —</option>
            {clinics.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="اسم الجهاز"><Input name="name" required defaultValue={device?.name ?? ""} /></Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="العلامة"><Input name="brand" defaultValue={device?.brand ?? ""} /></Field>
          <Field label="الموديل"><Input name="model" defaultValue={device?.model ?? ""} /></Field>
        </div>
        <Field label="الرقم التسلسلي"><Input name="serial" dir="ltr" defaultValue={device?.serial ?? ""} /></Field>
        <Field label="انتهاء الضمان" hint="اختياري">
          <Input name="warrantyEnd" type="date" dir="ltr" defaultValue={device?.warrantyEnd ?? ""} />
        </Field>
        <div className="flex gap-2">
          <Button type="submit" className="flex-1" disabled={pending}>{pending ? "جارٍ الحفظ…" : "حفظ"}</Button>
          <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
        </div>
      </form>
    </Card>
  );
}
