import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, XCircle, PauseCircle, Activity } from "lucide-react";

export const metadata = { title: "حالة الحساب" };

const STATES = {
  PENDING: {
    icon: Clock,
    tone: "text-warning bg-[rgba(245,181,61,0.12)]",
    title: "حسابك قيد المراجعة",
    body: "تم استلام طلبك بنجاح. تقوم إدارة المنصة بمراجعة بياناتك، وسيتم تفعيل وصولك فور الموافقة.",
  },
  REJECTED: {
    icon: XCircle,
    tone: "text-danger bg-[rgba(240,82,82,0.12)]",
    title: "تم رفض الحساب",
    body: "نأسف، لم تتم الموافقة على حسابك. يمكنك التواصل مع الدعم لمزيد من التفاصيل.",
  },
  SUSPENDED: {
    icon: PauseCircle,
    tone: "text-fg-muted bg-surface-3",
    title: "الحساب معلّق",
    body: "تم تعليق حسابك مؤقتاً. يرجى التواصل مع إدارة المنصة لإعادة التفعيل.",
  },
} as const;

export default async function AccountStatusPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.status === "APPROVED") redirect("/dashboard");

  const state = STATES[session.user.status as keyof typeof STATES] ?? STATES.PENDING;
  const Icon = state.icon;

  async function signOutAction() {
    "use server";
    await signOut({ redirectTo: "/login" });
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <Link href="/" className="mb-8 flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-[#04211f]">
          <Activity className="h-6 w-6" strokeWidth={2.5} />
        </span>
        <span className="text-2xl font-bold text-fg">VICTUS</span>
      </Link>

      <Card className="w-full max-w-md p-7 text-center">
        <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${state.tone}`}>
          <Icon className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-bold text-fg">{state.title}</h1>
        <p className="mt-2 text-sm text-fg-muted">{state.body}</p>
        <form action={signOutAction} className="mt-6">
          <Button variant="outline" className="w-full" type="submit">
            تسجيل الخروج
          </Button>
        </form>
      </Card>
    </div>
  );
}
