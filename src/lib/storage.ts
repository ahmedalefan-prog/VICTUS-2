import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

// ─────────────────────── Media / File Architecture ───────────────────────
// Storage-adapter abstraction + a polymorphic MediaFile registry so any module
// (devices, maintenance, CVs, lab files, company docs) attaches files uniformly.
//
// Adapters:
//   - vercel-blob : used automatically when BLOB_READ_WRITE_TOKEN is set
//   - local       : dev fallback, writes to /public/uploads (served at /uploads/*)

export type MediaKind = "IMAGE" | "DOCUMENT" | "PDF" | "CV" | "LOGO" | "AVATAR" | "OTHER";

export interface StoredFile {
  url: string;
  provider: "local" | "vercel-blob";
}

interface StorageAdapter {
  put(key: string, data: Buffer, contentType?: string): Promise<StoredFile>;
  remove(url: string): Promise<void>;
}

const useBlob = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

const localAdapter: StorageAdapter = {
  async put(key, data, contentType) {
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const safe = key.replace(/[^a-zA-Z0-9._-]/g, "_");
    await fs.writeFile(path.join(dir, safe), data);
    void contentType;
    return { url: `/uploads/${safe}`, provider: "local" };
  },
  async remove(url) {
    if (!url.startsWith("/uploads/")) return;
    await fs.rm(path.join(process.cwd(), "public", url), { force: true });
  },
};

const blobAdapter: StorageAdapter = {
  async put(key, data, contentType) {
    const { put } = await import("@vercel/blob");
    const res = await put(key, data, {
      access: "public",
      contentType,
      addRandomSuffix: true,
    });
    return { url: res.url, provider: "vercel-blob" };
  },
  async remove(url) {
    const { del } = await import("@vercel/blob");
    await del(url);
  },
};

function adapter(): StorageAdapter {
  return useBlob ? blobAdapter : localAdapter;
}

const MAX_BYTES = 10 * 1024 * 1024; // 10MB

// Save bytes + register a MediaFile row attached to an optional entity.
export async function saveMedia(input: {
  ownerId: string;
  data: Buffer;
  fileName: string;
  mimeType?: string;
  kind?: MediaKind;
  entityType?: string;
  entityId?: string;
}) {
  if (input.data.byteLength > MAX_BYTES) {
    throw new Error("حجم الملف يتجاوز الحد المسموح (10MB)");
  }
  const ext = path.extname(input.fileName) || "";
  const key = `${input.entityType ?? "misc"}/${randomUUID()}${ext}`;
  const stored = await adapter().put(key, input.data, input.mimeType);

  return prisma.mediaFile.create({
    data: {
      ownerId: input.ownerId,
      entityType: input.entityType,
      entityId: input.entityId,
      kind: (input.kind ?? "OTHER") as never,
      fileName: input.fileName,
      url: stored.url,
      mimeType: input.mimeType,
      sizeBytes: input.data.byteLength,
      provider: stored.provider,
    },
  });
}

export async function deleteMedia(id: string, ownerId: string) {
  const file = await prisma.mediaFile.findUnique({ where: { id } });
  if (!file || file.ownerId !== ownerId) throw new Error("الملف غير موجود");
  await adapter()
    .remove(file.url)
    .catch(() => undefined);
  await prisma.mediaFile.update({ where: { id }, data: { status: "DELETED" } });
}

export function listMedia(entityType: string, entityId: string) {
  return prisma.mediaFile.findMany({
    where: { entityType, entityId, status: "ACTIVE" },
    orderBy: { createdAt: "desc" },
  });
}

export const storageProvider = useBlob ? "vercel-blob" : "local";
