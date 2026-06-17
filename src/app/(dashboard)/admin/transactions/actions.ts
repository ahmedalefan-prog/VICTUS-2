"use server";

import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/guard";
import { recordAudit } from "@/lib/audit";
import { SERVICE_TYPE_META, TX_STATUS_META } from "@/lib/services-meta";
import { buildTxWhere, type TxFilters } from "./filters";

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Produce a CSV (UTF-8 BOM for Excel) of every transaction matching the filters.
export async function exportTransactionsCsv(filters: TxFilters): Promise<string> {
  const session = await requirePermission("transactions", "EXPORT");
  const rows = await prisma.partnerTransaction.findMany({ where: buildTxWhere(filters), orderBy: { createdAt: "desc" } });

  const header = ["التاريخ", "النوع", "الخدمة", "المرجع", "البند", "المستوى", "صاحب الطلب", "المبلغ (IQD)", "الحالة"];
  const lines = rows.map((r) =>
    [
      r.createdAt.toISOString().slice(0, 10),
      SERVICE_TYPE_META[r.type]?.label ?? r.type,
      r.serviceName,
      r.referenceId,
      r.serviceLabel,
      r.tier ?? "",
      r.requesterName,
      Number(r.agreedAmount),
      TX_STATUS_META[r.status]?.label ?? r.status,
    ]
      .map(csvCell)
      .join(","),
  );

  await recordAudit({
    actorId: session.user.id,
    action: "transactions.export",
    entityType: "PartnerTransaction",
    metadata: { count: rows.length, filters: filters as Record<string, unknown> },
  });

  return "﻿" + [header.map(csvCell).join(","), ...lines].join("\n");
}
