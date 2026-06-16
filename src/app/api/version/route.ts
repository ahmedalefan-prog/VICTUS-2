import { NextResponse } from "next/server";

// نقطة تشخيص: تُظهر commit/نشرة الإنتاج للتأكد أن آخر إصلاح منشور فعلاً.
export async function GET() {
  return NextResponse.json({
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? "local",
    deploymentId: process.env.VERCEL_DEPLOYMENT_ID ?? null,
    env: process.env.VERCEL_ENV ?? "development",
    region: process.env.VERCEL_REGION ?? null,
  });
}
