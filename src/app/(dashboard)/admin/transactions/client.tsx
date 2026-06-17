"use client";

import { useTransition } from "react";
import Link from "next/link";
import { exportTransactionsCsv } from "./actions";
import { type TxFilters as Filters } from "./filters";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

export function TxFilters() {
  return (
    <div className="flex gap-2">
      <Button type="submit" className="flex-1">تطبيق</Button>
      <Link href="/admin/transactions">
        <Button type="button" variant="outline">إعادة</Button>
      </Link>
    </div>
  );
}

export function ExportButton({ filters }: { filters: Filters }) {
  const [pending, startTransition] = useTransition();

  function download() {
    startTransition(async () => {
      const csv = await exportTransactionsCsv(filters);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `service-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  return (
    <Button variant="outline" disabled={pending} onClick={download}>
      <Download className="h-4 w-4" /> {pending ? "جارٍ التصدير…" : "تصدير CSV"}
    </Button>
  );
}
