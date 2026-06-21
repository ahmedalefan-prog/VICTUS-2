"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction, type ActionState } from "../actions";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Field } from "@/components/ui/input";
import { AlertCircle, Activity } from "lucide-react";

const initial: ActionState = { ok: false };

function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute -left-1/4 -top-1/4 h-[600px] w-[600px] rounded-full opacity-[0.04] blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          animation: "float 8s ease-in-out infinite",
        }}
      />
      <div
        className="absolute -bottom-1/4 -right-1/4 h-[500px] w-[500px] rounded-full opacity-[0.03] blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--accent) 0%, transparent 70%)",
          animation: "float 10s ease-in-out infinite reverse",
        }}
      />
      <div
        className="absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full opacity-[0.02] blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--primary) 0%, transparent 70%)",
          animation: "pulse-glow 4s ease-in-out infinite",
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(loginAction, initial);
  const staggerRef = useRef<HTMLDivElement>(null);
  const errorRef = useRef<HTMLDivElement>(null);
  const errorCount = useRef(0);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const el = staggerRef.current;
    if (el) el.classList.add("stagger-children");
  }, []);

  useEffect(() => {
    if (state.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state.ok, router]);

  useEffect(() => {
    if (state.error) {
      errorCount.current++;
      const el = errorRef.current;
      if (el) {
        el.classList.remove("animate-shake");
        void el.offsetWidth;
        el.classList.add("animate-shake");
      }
    }
  }, [state.error]);

  return (
    <>
      <AnimatedBackground />

      <Card className="relative overflow-hidden p-7">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-primary/[0.03] to-transparent" />

        <div ref={staggerRef} className="space-y-5">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-[var(--primary-fg)] shadow-[0_8px_24px_-8px_var(--primary)]">
              <Activity className="h-6 w-6" strokeWidth={2.5} />
            </span>
            <h1 className="text-xl font-bold text-fg">تسجيل الدخول</h1>
          </div>
          <p className="text-sm text-fg-muted">
            أدخل بياناتك للوصول إلى لوحة التحكم.
          </p>

          {state.error ? (
            <div
              ref={errorRef}
              className="flex items-center gap-2 rounded-lg border border-danger/30 bg-[rgba(240,82,82,0.1)] px-3 py-2.5 text-sm text-danger"
            >
              <AlertCircle className="h-4 w-4 shrink-0" />
              {state.error}
            </div>
          ) : null}

          <form ref={formRef} action={action} className="space-y-4">
            <Field label="البريد الإلكتروني">
              <Input
                name="email"
                type="email"
                required
                placeholder="name@victus.iq"
                dir="ltr"
                className="transition-shadow duration-300 focus:shadow-[0_0_0_2px_var(--primary)]"
              />
            </Field>
            <Field label="كلمة المرور">
              <Input
                name="password"
                type="password"
                required
                placeholder="••••••••"
                dir="ltr"
                className="transition-shadow duration-300 focus:shadow-[0_0_0_2px_var(--primary)]"
              />
            </Field>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? "جارٍ الدخول…" : "دخول"}
            </Button>
          </form>

          <p className="text-center text-sm text-fg-muted">
            ليس لديك حساب؟{" "}
            <Link
              href="/register"
              className="font-medium text-primary transition-colors hover:text-primary-strong hover:underline"
            >
              إنشاء حساب جديد
            </Link>
          </p>
        </div>
      </Card>
    </>
  );
}
