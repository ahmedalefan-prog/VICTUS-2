import { prisma } from "@/lib/prisma";
import { RegisterForm } from "./register-form";

export const metadata = { title: "إنشاء حساب" };
export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const governorates = await prisma.governorate
    .findMany({ orderBy: { nameAr: "asc" }, select: { id: true, nameAr: true } })
    .catch(() => []);

  return <RegisterForm governorates={governorates} />;
}
