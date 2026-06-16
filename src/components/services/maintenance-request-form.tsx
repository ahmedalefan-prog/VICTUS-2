"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRequest } from "@/lib/maintenance-actions";
import { MAINTENANCE_PRIORITY_META } from "@/lib/services-meta";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Textarea, Select, Field } from "@/components/ui/input";
import { Wrench } from "lucide-react";

export function MaintenanceRequestForm() {
  const router = useRouter();
  const [deviceName, setDeviceName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [media, setMedia] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit() {
    setError(null);
    const mediaUrls = media
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean);
    startTransition(async () => {
      try {
        const { id } = await createRequest({ deviceName, description, priority, mediaUrls });
        router.push(`/maintenance/${id}`);
      } catch (e) {
        setError(e instanceof Error ? e.message : "تعذّر إرسال الطلب");
      }
    });
  }

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2">
        <Wrench className="h-5 w-5 text-primary" />
        <h3 className="font-semibold text-fg">طلب صيانة جديد</h3>
      </div>
      <div className="space-y-4">
        {error && <p className="text-sm text-danger">{error}</p>}

        <Field label="الجهاز المعطّل">
          <Input value={deviceName} onChange={(e) => setDeviceName(e.target.value)} placeholder="مثال: كرسي الأسنان — العيادة الرئيسية" maxLength={200} />
        </Field>

        <Field label="وصف العطل">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="صف المشكلة بإيجاز…" maxLength={2000} />
        </Field>

        <Field label="الأولوية">
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            {Object.entries(MAINTENANCE_PRIORITY_META).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </Select>
        </Field>

        <Field label="صور / فيديو (اختياري)" hint="روابط خارجية، رابط في كل سطر أو مفصولة بفاصلة.">
          <Textarea value={media} onChange={(e) => setMedia(e.target.value)} placeholder="https://…" className="min-h-16" dir="ltr" />
        </Field>

        <Button className="w-full" disabled={pending || !deviceName.trim() || description.trim().length < 5} onClick={submit}>
          {pending ? "جارٍ الإرسال…" : "إرسال الطلب"}
        </Button>
      </div>
    </Card>
  );
}
