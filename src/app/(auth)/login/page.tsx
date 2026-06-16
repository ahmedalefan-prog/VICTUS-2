"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction, type ActionState } from "../actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { AlertCircle } from "lucide-react";

const initial: ActionState = { ok: false };

export default function LoginPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(loginAction, initial);

  useEffect(() => {
    if (state.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state.ok, router]);

  return (
    <Card className="p-7">
      <h1 className="text-xl font-bold text-fg">تسجيل الدخول</h1>
      <p className="mt-1 text-sm text-fg-muted">أدخل بياناتك للوصول إلى لوحة التحكم.</p>

      <form action={action} className="mt-6 space-y-4">
        {state.error ? (
          <div className="flex items-center gap-2 rounded-lg border border-danger/30 bg-[rgba(240,82,82,0.1)] px-3 py-2.5 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {state.error}
          </div>
        ) : null}

        <Field label="البريد الإلكتروني">
          <Input name="email" type="email" required placeholder="name@victus.iq" dir="ltr" />
        </Field>
        <Field label="كلمة المرور">
          <Input name="password" type="password" required placeholder="••••••••" dir="ltr" />
        </Field>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "جارٍ الدخول…" : "دخول"}
        </Button>
      </form>

      <p className="mt-5 text-center text-sm text-fg-muted">
        ليس لديك حساب؟{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </Card>
  );
}
