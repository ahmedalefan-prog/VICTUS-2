import type { Prisma } from "@/generated/prisma";

export interface TxFilters {
  serviceId?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
}

// Build a Prisma where-clause from the dashboard filters (shared by page + export).
export function buildTxWhere(f: TxFilters): Prisma.PartnerTransactionWhereInput {
  const where: Prisma.PartnerTransactionWhereInput = {};
  if (f.serviceId) where.serviceId = f.serviceId;
  if (f.type) where.type = f.type as never;
  if (f.status) where.status = f.status as never;
  if (f.from || f.to) {
    where.createdAt = {};
    if (f.from) where.createdAt.gte = new Date(f.from);
    if (f.to) {
      const to = new Date(f.to);
      to.setHours(23, 59, 59, 999);
      where.createdAt.lte = to;
    }
  }
  return where;
}
