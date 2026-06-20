"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CalendarDays, type LucideIcon, MessageSquare, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import * as api from "@/lib/api";

type TabDef = { href: string; label: string; icon: LucideIcon; badge?: boolean };

const tabs: TabDef[] = [
  { href: "/events", label: "Events", icon: CalendarDays },
  { href: "/messages", label: "Messages", icon: MessageSquare, badge: true },
  { href: "/profile", label: "Profile", icon: User },
];

export function TabBar() {
  const pathname = usePathname();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    api.getChats().then((c) => setUnread(c.reduce((n, x) => n + x.unread, 0)));
  }, [pathname]);

  return (
    <nav className="sticky bottom-0 z-40 mx-auto w-full max-w-app border-t border-wuerth-line bg-white pb-[max(0.375rem,env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-3">
        {tabs.map((t) => {
          const active = pathname.startsWith(t.href);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="flex flex-col items-center gap-1 pt-2.5 text-[11px] font-semibold"
            >
              <span
                className={cn(
                  "relative grid h-8 w-14 place-items-center rounded-lg transition-colors",
                  active ? "bg-wuerth-red-soft text-wuerth-red" : "text-wuerth-mute"
                )}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 2} />
                {t.badge && unread > 0 && (
                  <Badge count={unread} className="absolute right-2 top-0" />
                )}
              </span>
              <span className={active ? "text-wuerth-red" : "text-wuerth-mute"}>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
