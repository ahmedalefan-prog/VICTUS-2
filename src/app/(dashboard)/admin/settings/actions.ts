"use server";

import { revalidatePath } from "next/cache";
import { setSetting } from "@/lib/settings";
import { requirePermission } from "@/lib/guard";
import { recordAudit } from "@/lib/audit";

export async function saveSettings(formData: FormData): Promise<void> {
  const session = await requirePermission("settings", "MANAGE");

  // Each field name is the setting key. Booleans arrive as "true"/"false".
  for (const [key, raw] of formData.entries()) {
    if (key.startsWith("$")) continue;
    let value: unknown = raw;
    if (raw === "true") value = true;
    else if (raw === "false") value = false;
    await setSetting(key, value);
  }

  await recordAudit({ actorId: session.user.id, action: "settings.update" });
  revalidatePath("/admin/settings");
}
