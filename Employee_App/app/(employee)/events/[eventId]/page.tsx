"use client";

import { useEffect, useState } from "react";
import { CalendarClock, CalendarDays, MapPin, Users } from "lucide-react";
import type { EventDetail } from "@/lib/types";
import * as api from "@/lib/api";
import { TopAppBar } from "@/components/employee/TopAppBar";
import { EventStatusBadge } from "@/components/employee/EventStatusBadge";
import { KpiPanel } from "@/components/employee/KpiPanel";
import { AttendeesPanel } from "@/components/employee/AttendeesPanel";
import { InteractionsPanel } from "@/components/employee/InteractionsPanel";
import { NotesPanel } from "@/components/employee/NotesPanel";
import { SentimentPanel } from "@/components/employee/SentimentPanel";
import { QrPanel } from "@/components/employee/QrPanel";
import { BroadcastPanel } from "@/components/employee/BroadcastPanel";
import { MaterialsPanel } from "@/components/employee/MaterialsPanel";
import { HostReportPanel } from "@/components/employee/HostReportPanel";
import { Chip } from "@/components/ui/Chip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { eventTypeLabel, formatDateRange } from "@/lib/utils";

type Tab = "overview" | "people" | "live" | "files";

const isUpcoming = (e: EventDetail) =>
  e.status === "upcoming" || e.status === "planned" || e.status === "draft";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 mt-1 px-1 text-xs font-bold uppercase tracking-wide text-wuerth-mute">
      {children}
    </h2>
  );
}

export default function EventDetailPage({ params }: { params: { eventId: string } }) {
  const { eventId } = params;
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    api.getEvent(eventId).then(setEvent);
  }, [eventId]);

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <TopAppBar back title={event ? event.title : "Event"} />

      {/* Event summary header — minimal, no chip overload */}
      <div className="bg-white px-5 pb-4 pt-3 shadow-card">
        {!event ? (
          <>
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="mt-2.5 h-4 w-1/2" />
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <Chip tone="red">{eventTypeLabel(event.type)}</Chip>
              <EventStatusBadge status={event.status} />
            </div>
            <h1 className="mt-2.5 text-lg font-bold leading-snug text-wuerth-ink">{event.title}</h1>
            <div className="mt-2 space-y-1.5 text-[13px] text-wuerth-slate">
              <div className="flex items-center gap-2">
                <CalendarDays size={15} className="shrink-0 text-wuerth-mute" />
                {formatDateRange(event.startAt, event.endAt)}
              </div>
              {event.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="shrink-0 text-wuerth-mute" />
                  <span className="truncate">{event.location}</span>
                </div>
              )}
              {event.attendeeCount > 0 && (
                <div className="flex items-center gap-2">
                  <Users size={15} className="shrink-0 text-wuerth-mute" />
                  {event.attendeeCount} {event.status === "past" ? "attended" : "checked in"}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* 4 evenly-spaced tabs — fit the width, no horizontal scrolling */}
      <div className="sticky top-14 z-20 bg-wuerth-bg/95 px-4 py-2.5 backdrop-blur">
        <SegmentedControl<Tab>
          segments={[
            { value: "overview", label: "Overview" },
            { value: "people", label: "People" },
            { value: "live", label: "Live" },
            { value: "files", label: "Files" },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>

      {/* Active group */}
      <div className="flex-1 px-4 pb-6">
        {!event ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : (
          <>
            {tab === "overview" && (
              <div>
                {isUpcoming(event) ? (
                  <UpcomingNotice event={event} />
                ) : (
                  <KpiPanel eventId={eventId} />
                )}
              </div>
            )}

            {tab === "people" && (
              <div className="space-y-5">
                <div>
                  <SectionHeader>Attendees</SectionHeader>
                  <AttendeesPanel eventId={eventId} />
                </div>
                <div>
                  <SectionHeader>Interactions</SectionHeader>
                  <InteractionsPanel eventId={eventId} />
                </div>
              </div>
            )}

            {tab === "live" && (
              <div className="space-y-5">
                <div>
                  <SectionHeader>Check-in / Check-out QR</SectionHeader>
                  <QrPanel eventId={eventId} />
                </div>
                <div>
                  <SectionHeader>Broadcast to attendees</SectionHeader>
                  <BroadcastPanel eventId={eventId} attendeeCount={event.attendeeCount} />
                </div>
                <div>
                  <SectionHeader>Crowd sentiment</SectionHeader>
                  <SentimentPanel eventId={eventId} liveEnabled={event.liveAnalyticsEnabled} />
                </div>
              </div>
            )}

            {tab === "files" && (
              <div className="space-y-5">
                <div>
                  <SectionHeader>Files & materials</SectionHeader>
                  <MaterialsPanel eventId={eventId} />
                </div>
                <div>
                  <SectionHeader>Private notes</SectionHeader>
                  <NotesPanel eventId={eventId} />
                </div>
                <div>
                  <SectionHeader>Host report</SectionHeader>
                  <HostReportPanel eventId={eventId} />
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function UpcomingNotice({ event }: { event: EventDetail }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center rounded-2xl bg-white px-6 py-10 text-center shadow-card ring-1 ring-wuerth-line/70">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-wuerth-red-soft text-wuerth-red">
          <CalendarClock size={26} />
        </span>
        <h3 className="mt-3 text-sm font-bold text-wuerth-ink">No KPIs yet</h3>
        <p className="mt-1 max-w-[18rem] text-sm text-wuerth-mute">
          This event hasn&apos;t started. KPIs appear once attendees start checking in. Use the{" "}
          <span className="font-semibold text-wuerth-slate">Live</span> tab to prepare check-in QR
          codes and the <span className="font-semibold text-wuerth-slate">Files</span> tab to share
          materials in advance.
        </p>
      </div>

      {(event.goal || event.targetGroup) && (
        <div className="rounded-2xl bg-white p-4 shadow-card ring-1 ring-wuerth-line/70">
          {event.goal && (
            <div className="text-sm">
              <span className="font-semibold text-wuerth-ink">Goal: </span>
              <span className="text-wuerth-slate">{event.goal}</span>
            </div>
          )}
          {event.targetGroup && (
            <div className="mt-1.5 text-sm">
              <span className="font-semibold text-wuerth-ink">Target group: </span>
              <span className="text-wuerth-slate">{event.targetGroup}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
