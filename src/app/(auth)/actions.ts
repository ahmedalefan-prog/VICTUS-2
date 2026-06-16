"use server";

import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signIn } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { dispatchNotification } from "@/lib/notifications";
import { REGISTERABLE_ACCOUNT_TYPES } from "@/lib/rbac";
import { AuthError } from "next-auth";

const accountTypeValues = REGISTERABLE_ACCOUNT_TYPES.map((t) => t.value) as [
  string,
  ...string[],
];

const registerSchema = z.object({
  fullName: z.string().min(3, "الاسم قصير جداً"),
  email: z.string().email("بريد إلكتروني غير صالح"),
  phone: z.string().min(8, "رقم هاتف غير صالح").optional().or(z.literal("")),
  password: z.string().min(8, "كلمة المرور يجب أن تكون 8 أحرف على الأقل"),
  accountType: z.enum(accountTypeValues),
  governorateId: z.string().optional().or(z.literal("")),
});

export type ActionState = { ok: boolean; error?: string; fieldErrors?: Record<string, string> };

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = registerSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    accountType: formData.get("accountType"),
    governorateId: formData.get("governorateId"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      fieldErrors[String(issue.path[0])] = issue.message;
    }
    return { ok: false, error: "يرجى تصحيح الحقول المظللة", fieldErrors };
  }

  const data = parsed.data;
  const email = data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, error: "هذا البريد الإلكتروني مسجّل مسبقاً", fieldErrors: { email: "مستخدم بالفعل" } };
  }

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      phone: data.phone || null,
      passwordHash,
      fullName: data.fullName,
      accountType: data.accountType as never,
      status: "PENDING",
      governorateId: data.governorateId || null,
    },
  });

  await recordAudit({
    actorId: user.id,
    action: "account.register",
    entityType: "User",
    entityId: user.id,
    metadata: { accountType: data.accountType },
  });
  await dispatchNotification({ event: "account.registered", userId: user.id });

  return { ok: true };
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await signIn("credentials", { email, password, redirect: false });
  } catch (error) {
    if (error instanceof AuthError) {
      return { ok: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    }
    throw error;
  }
  return { ok: true };
}
