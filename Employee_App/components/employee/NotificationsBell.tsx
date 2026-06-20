"use client";

import { useEffect, useState } from "react";
import { Bell, Inbox, X } from "lucide-react";
import type { NotificationItem } from "@/lib/types";
import * as api from "@/lib/api";
import { IconButton } from "@/components/ui/IconButton";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { NotificationCard } from "@/components/employee/NotificationCard";

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.getNotifications().then((n) => {
      setItems(n);
      setUnread(n.filter((x) => !x.readAt).length);
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  async function markAll() {
    await Promise.all(items.filter((i) => !i.readAt).map((i) => api.markNotificationRead(i.id)));
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setUnread(0);
  }

  return (
    <>
      <IconButton aria-label="Notifications" className="text-white" onClick={() => setOpen(true)}>
        <Bell size={22} />
        <Badge count={unread} className="absolute right-1 top-1" />
      </IconButton>

      {open && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center">
          <div
            className="absolute inset-0 bg-wuerth-ink/45 animate-fade-in"
            onClick={() => setOpen(false)}
          />

          {/* iOS-style half sheet */}
          <div className="relative mx-auto flex max-h-[85vh] w-full max-w-app flex-col rounded-t-3xl bg-white shadow-pop animate-slide-up">
            {/* grabber */}
            <div className="flex flex-col items-center pt-2.5">
              <span className="h-1.5 w-10 rounded-full bg-zinc-200" />
            </div>

            {/* Header */}
            <header className="flex items-center justify-between gap-2 px-5 pb-2 pt-3">
              <h2 className="text-[17px] font-bold text-wuerth-ink">Notifications &amp; reports</h2>
              <div className="flex items-center gap-1.5">
                {unread > 0 && (
                  <button
                    onClick={markAll}
                    className="rounded-lg bg-wuerth-red-soft px-3 py-1.5 text-xs font-bold text-wuerth-red"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-100 text-wuerth-slate transition-colors hover:bg-zinc-200"
                  aria-label="Close"
                >
                  <X size={17} />
                </button>
              </div>
            </header>

            {/* Scrollable body */}
            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-2">
              {items.length === 0 ? (
                <EmptyState icon={Inbox} title="All clear" description="No notifications right now." />
              ) : (
                <div className="space-y-8">
                  {items.map((item) => (
                    <NotificationCard key={item.id} item={item} onOpen={() => setOpen(false)} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
