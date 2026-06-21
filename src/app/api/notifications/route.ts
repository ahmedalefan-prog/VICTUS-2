import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApproved } from "@/lib/guard";

export async function GET() {
  try {
    const session = await requireApproved();
    const [notifications, unread] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          title: true,
          body: true,
          link: true,
          type: true,
          createdAt: true,
          readAt: true,
        },
      }),
      prisma.notification.count({ where: { userId: session.user.id, readAt: null } }),
    ]);
    return NextResponse.json({
      notifications: notifications.map((n) => ({
        ...n,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() ?? null,
      })),
      unread,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await requireApproved();
    const body = await req.json();

    if (body.all) {
      await prisma.notification.updateMany({
        where: { userId: session.user.id, readAt: null },
        data: { readAt: new Date() },
      });
    } else if (body.ids?.length) {
      await prisma.notification.updateMany({
        where: { id: { in: body.ids }, userId: session.user.id },
        data: { readAt: new Date() },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireApproved();
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      await prisma.notification.deleteMany({
        where: { id, userId: session.user.id },
      });
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
