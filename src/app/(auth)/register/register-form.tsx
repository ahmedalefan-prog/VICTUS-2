"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { registerAction, type ActionState } from "../actions";
import { REGISTERABLE_ACCOUNT_TYPES } from "@/lib/rbac";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select, Field } from "@/components/ui/input";
import { AlertCircle, CheckCircle2 } from "lucide-react";

const initial: ActionState = { ok: false };

export function RegisterForm({
  governorates,
}: {
  governorates: { id: string; nameAr: string }[];
}) {
  const [state, action, pending] = useActionState(registerAction, initial);
  const [accountType, setAccountType] = useState("");

  if (state.ok) {
    return (
      <Card className="p-7 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(34,197,94,0.12)] text-success">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-fg">تم استلام طلبك بنجاح</h1>
        <p className="mt-2 text-sm text-fg-muted">
          حسابك الآن قيد المراجعة من قبل إدارة المنصة. سيتم تفعيل الوصول فور الموافقة.
        </p>
        <Link href="/login">
          <Button className="mt-6 w-full">العودة لتسجيل الدخول</Button>
        </Link>
      </Card>
    );
  }

  const err = state.fieldErrors ?? {};

  return (
    <Card className="p-7">
      <h1 className="text-xl font-bold text-fg">إنشاء حساب جديد</h1>
      <p className="mt-1 text-sm text-fg-muted">
        اختر نوع الحساب المناسب لنشاطك. سيتم مراجعة الطلب قبل التفعيل.
      </p>

      <form action={action} className="mt-6 space-y-4">
        {state.error ? (
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-[rgba(240,82,82,0.1)] px-3 py-2.5 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.error}
          </div>
        ) : null}

        <Field label="نوع الحساب" hint="يحدد نوع الحساب الأقسام التي ستصل إليها بعد الموافقة.">
          <Select
            name="accountType"
            required
            value={accountType}
            onChange={(e) => setAccountType(e.target.value)}
          >
            <option value="" disabled>
              — اختر نوع الحساب —
            </option>
            {REGISTERABLE_ACCOUNT_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="الاسم الكامل" hint={err.fullName}>
          <Input name="fullName" required placeholder="مثال: د. أحمد العفان" />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="البريد الإلكتروني" hint={err.email}>
            <Input name="email" type="email" required placeholder="name@victus.iq" dir="ltr" />
          </Field>
          <Field label="رقم الهاتف" hint={err.phone}>
            <Input name="phone" placeholder="07XXXXXXXXX" dir="ltr" />
          </Field>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="المحافظة">
            <Select name="governorateId" defaultValue="">
              <option value="">— غير محدد —</option>
              {governorates.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.nameAr}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="كلمة المرور" hint={err.password ?? "8 أحرف على الأقل"}>
            <Input name="password" type="password" required placeholder="••••••••" dir="ltr" />
          </Field>
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "جارٍ الإرسال…" : "إنشاء الحساب"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-fg-muted">
        لديك حساب بالفعل؟{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </Card>
  );
}
