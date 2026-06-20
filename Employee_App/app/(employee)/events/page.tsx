"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarX2 } from "lucide-react";
import type { EventSummary } from "@/lib/types";
import { useAuth } from "@/lib/auth";
import * as api from "@/lib/api";
import { TopAppBar } from "@/components/employee/TopAppBar";
import { NotificationsBell } from "@/components/employee/NotificationsBell";
import { EventCard } from "@/components/employee/EventCard";
import { WuerthLogo } from "@/components/ui/WuerthLogo";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";

type Filter = "upcoming" | "past";

const isUpcoming = (e: EventSummary) =>
  e.status === "upcoming" || e.status === "ongoing" || e.status === "planned" || e.status === "draft";

export default function EventsPage() {
  const { employee } = useAuth();
  const [events, setEvents] = useState<EventSummary[] | null>(null);
  const [filter, setFilter] = useState<Filter>("upcoming");

  useEffect(() => {
    if (!employee) return;
    setEvents(null);
    api.getMyEvents(employee.id).then(setEvents);
  }, [employee]);

  const filtered = useMemo(() => {
    if (!events) return [];
    const list = events.filter((e) => (filter === "upcoming" ? isUpcoming(e) : e.status === "past" || e.status === "cancelled"));
    // Live events first, then by date ascending for upcoming / descending for past.
    return list.sort((a, b) => {
      if (a.status === "ongoing" && b.status !== "ongoing") return -1;
      if (b.status === "ongoing" && a.status !== "ongoing") return 1;
      const da = +new Date(a.startAt);
      const db = +new Date(b.startAt);
      return filter === "upcoming" ? da - db : db - da;
    });
  }, [events, filter]);

  return (
    <div className="h-full overflow-y-auto pb-28">
      <TopAppBar
        title={<WuerthLogo variant="white" className="text-base" />}
        right={<NotificationsBell />}
      />

      <div className="px-4 pt-4">
        <h1 className="text-xl font-bold text-wuerth-ink">My events</h1>
        <p className="mt-0.5 text-sm text-wuerth-mute">
          {employee?.displayName} · {employee?.branchOffice}
        </p>
      </div>

      <div className="sticky top-14 z-20 bg-wuerth-bg/95 px-4 py-3 backdrop-blur">
        <SegmentedControl<Filter>
          segments={[
            { value: "upcoming", label: "Upcoming & live" },
            { value: "past", label: "Past" },
          ]}
          value={filter}
          onChange={setFilter}
        />
      </div>

      <div className="px-4">
        {events === null ? (
          <ListSkeleton rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title={filter === "upcoming" ? "No upcoming events" : "No past events"}
            description={
              filter === "upcoming"
                ? "You have no scheduled events right now."
                : "Past events you ran will appear here."
            }
          />
        ) : (
          <div className="space-y-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
