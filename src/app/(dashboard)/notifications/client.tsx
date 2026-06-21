"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { Bell, Mail, MailOpen, Trash2, RefreshCw, CheckCheck, Clock, Filter } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/dashboard-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { usePolling } from "@/hooks/use-polling";
import { toast } from "@/hooks/use-toast";

interface Notif {
  id: string;
  title: string;
  body: string | null;
  link: string | null;
  type: string;
  createdAt: string;
  readAt: string | null;
}

export function NotificationsClient({
  initialNotifications,
  initialUnread,
}: {
  initialNotifications: Notif[];
  initialUnread: number;
}) {
  const [notifs, setNotifs] = useState(initialNotifications);
  const [unread, setUnread] = useState(initialUnread);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");
  const [loading, setLoading] = useState(false);

  const fetchNotifs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifs(data.notifications);
        setUnread(data.unread);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  usePolling(fetchNotifs, 15000);

  const markRead = async (id: string) => {
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n)),
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [id] }),
      });
    } catch {
      fetchNotifs();
    }
  };

  const markAllRead = async () => {
    if (unread === 0) return;
    const now = new Date().toISOString();
    setNotifs((prev) => prev.map((n) => (n.readAt ? n : { ...n, readAt: now })));
    setUnread(0);
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
      toast({ title: "تم قراءة الكل", variant: "success" });
    } catch {
      fetchNotifs();
    }
  };

  const deleteNotif = async (id: string) => {
    setNotifs((prev) => prev.filter((n) => n.id !== id));
    const wasUnread = notifs.find((n) => n.id === id)?.readAt === null;
    if (wasUnread) setUnread((u) => Math.max(0, u - 1));
    try {
      await fetch(`/api/notifications?id=${id}`, { method: "DELETE" });
    } catch {
      fetchNotifs();
    }
  };

  const filtered = notifs.filter((n) => {
    if (filter === "unread") return !n.readAt;
    if (filter === "read") return n.readAt;
    return true;
  });

  const TYPE_META: Record<string, { label: string; color: string }> = {
    SYSTEM: { label: "نظام", color: "text-info" },
    ACCOUNT: { label: "حساب", color: "text-accent" },
    ORDER: { label: "طلب", color: "text-primary" },
    MAINTENANCE: { label: "صيانة", color: "text-warning" },
    JOB: { label: "وظيفة", color: "text-success" },
    AD: { label: "إعلان", color: "text-danger" },
    GENERAL: { label: "عام", color: "text-fg-muted" },
  };

  return (
    <>
      <PageHeader title="الإشعارات" description="كل ما يخصك على المنصة">
        <div className="flex items-center gap-2">
          {unread > 0 && (
            <Button size="sm" variant="ghost" onClick={markAllRead}>
              <CheckCheck className="h-4 w-4" />
              تعيين الكل مقروء ({unread})
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={fetchNotifs}
            disabled={loading}
            aria-label="تحديث الإشعارات"
            className={cn(loading && "animate-spin")}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </PageHeader>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-fg-faint" />
        {(["all", "unread", "read"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            aria-pressed={filter === f}
            className={cn(
              "rounded-full border px-3 py-1 text-xs transition-colors",
              filter === f
                ? "border-primary bg-primary-soft text-primary"
                : "border-border-soft text-fg-muted hover:text-fg",
            )}
          >
            {f === "all" ? "الكل" : f === "unread" ? "غير مقروء" : "مقروء"}
          </button>
        ))}
        {loading && <Skeleton className="h-4 w-16" />}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Bell className="h-7 w-7" />}
          title={filter === "unread" ? "لا توجد إشعارات غير مقروءة" : "لا توجد إشعارات"}
          description={
            filter === "unread"
              ? "كل الإشعارات مقروءة. سنُعلمك عند وصول جديد."
              : "عند وصول إشعار جديد سيظهر هنا."
          }
        />
      ) : (
        <div className="space-y-2 stagger-children">
          {filtered.map((n) => {
            const meta = TYPE_META[n.type] ?? TYPE_META.GENERAL;
            const unread = !n.readAt;
            const content = (
              <div
                className={cn(
                  "group flex items-start gap-4 rounded-xl border p-4 transition-all duration-200",
                  unread
                    ? "border-primary/20 bg-primary-soft/10"
                    : "border-border-soft bg-surface/40 hover:border-border",
                )}
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    unread ? "bg-primary-soft text-primary" : "bg-surface-2 text-fg-faint",
                  )}
                >
                  {unread ? <Mail className="h-5 w-5" /> : <MailOpen className="h-5 w-5" />}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        "text-sm font-medium",
                        unread ? "text-fg" : "text-fg-muted",
                      )}
                    >
                      {n.title}
                    </p>
                    <Badge tone="muted" className={cn("text-[10px]", meta.color)}>
                      {meta.label}
                    </Badge>
                  </div>
                  {n.body && (
                    <p className="mt-1 text-xs text-fg-muted line-clamp-2">{n.body}</p>
                  )}
                  <div className="mt-2 flex items-center gap-3 text-[11px] text-fg-faint">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDateTime(n.createdAt)}
                    </span>
                    {unread && <span className="h-1.5 w-1.5 rounded-full bg-primary" />}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                  {unread && (
                    <button
                      type="button"
                      onClick={() => markRead(n.id)}
                      aria-label="تعيين مقروء"
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-faint hover:bg-surface-2 hover:text-primary transition-colors"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteNotif(n.id)}
                    aria-label="حذف الإشعار"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-fg-faint hover:bg-surface-2 hover:text-danger transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );

            if (n.link) {
              return (
                <Link key={n.id} href={n.link}>
                  {content}
                </Link>
              );
            }
            return (
              <div
                key={n.id}
                onClick={() => !n.readAt && markRead(n.id)}
                className="cursor-pointer"
              >
                {content}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
