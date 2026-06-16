import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { saveMedia, deleteMedia, type MediaKind } from "@/lib/storage";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user || session.user.status !== "APPROVED") {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "لم يتم إرفاق ملف" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  try {
    const media = await saveMedia({
      ownerId: session.user.id,
      data: buffer,
      fileName: file.name,
      mimeType: file.type,
      kind: (form.get("kind") as MediaKind) ?? "OTHER",
      entityType: (form.get("entityType") as string) || undefined,
      entityId: (form.get("entityId") as string) || undefined,
    });
    return NextResponse.json({
      id: media.id,
      url: media.url,
      fileName: media.fileName,
      kind: media.kind,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر رفع الملف";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "غير مصرّح" }, { status: 401 });
  }
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "معرّف الملف مطلوب" }, { status: 400 });

  try {
    await deleteMedia(id, session.user.id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "تعذّر حذف الملف";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
