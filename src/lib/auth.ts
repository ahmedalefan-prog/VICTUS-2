import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getEffectivePermissions, ensureDefaultRole } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountType: string;
      status: string;
      permissions: string[];
    } & DefaultSession["user"];
  }
  interface User {
    accountType: string;
    status: string;
    permissions: string[];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    id: string;
    accountType: string;
    status: string;
    permissions: string[];
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").toLowerCase().trim();
        const password = String(credentials?.password ?? "");
        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return null;

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) return null;

        // شبكة أمان: أصلِح الحسابات المعتمَدة بلا دور (تتجنّب denied=1 على كل الصفحات).
        if (user.status === "APPROVED") await ensureDefaultRole(user.id, user.accountType);
        const permissions = await getEffectivePermissions(user.id);
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        return {
          id: user.id,
          email: user.email,
          name: user.fullName,
          accountType: user.accountType,
          status: user.status,
          permissions,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id as string;
        token.accountType = user.accountType;
        token.status = user.status;
        token.permissions = user.permissions;
      }
      // Refresh status/permissions when the session is explicitly updated.
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { status: true, accountType: true },
        });
        if (fresh) {
          token.status = fresh.status;
          token.accountType = fresh.accountType;
          token.permissions = await getEffectivePermissions(token.id);
        }
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.accountType = token.accountType;
      session.user.status = token.status;
      session.user.permissions = token.permissions ?? [];
      return session;
    },
  },
});
