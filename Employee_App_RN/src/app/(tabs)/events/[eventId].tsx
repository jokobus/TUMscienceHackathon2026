import { useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { CalendarClock, CalendarDays, MapPin, Users } from "lucide-react-native";
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
import { ApplicationsPanel } from "@/components/employee/ApplicationsPanel";
import { MaterialsPanel } from "@/components/employee/MaterialsPanel";
import { HostReportPanel } from "@/components/employee/HostReportPanel";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Skeleton } from "@/components/ui/Skeleton";
import { eventTypeLabel, formatDateRange } from "@/lib/utils";
import { wuerth } from "@/theme";

type Tab = "overview" | "people" | "applications" | "live" | "files";

const isUpcoming = (e: EventDetail) =>
  e.status === "upcoming" || e.status === "planned" || e.status === "draft";

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mb-2 mt-1 px-1 text-xs font-bold uppercase tracking-wide text-wuerth-mute">
      {children}
    </Text>
  );
}

export default function EventDetailScreen() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [error, setError] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");

  useEffect(() => {
    if (!eventId) return;
    setEvent(null);
    setError(false);
    // Always handle rejection: an expired session or unreachable backend would
    // otherwise surface as an "unhandled promise rejection" instead of a clean
    // error state.
    api.getEvent(eventId).then(setEvent).catch(() => setError(true));
  }, [eventId]);

  return (
    <View className="flex-1 bg-wuerth-bg">
      <TopAppBar back title={event ? event.title : "Event"} />

      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="border-b border-wuerth-line bg-white px-5 pb-4 pt-3">
          {error ? (
            <Text className="text-base font-semibold text-wuerth-ink">
              Couldn&apos;t load this event
            </Text>
          ) : !event ? (
            <>
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="mt-2.5 h-4 w-1/2" />
            </>
          ) : (
            <>
              <View className="flex-row items-center gap-2">
                <Chip tone="red">{eventTypeLabel(event.type)}</Chip>
                <EventStatusBadge status={event.status} />
              </View>
              <Text className="mt-2.5 text-lg font-bold leading-snug text-wuerth-ink">
                {event.title}
              </Text>
              <View className="mt-2 gap-1.5">
                <View className="flex-row items-center gap-2">
                  <CalendarDays size={15} color={wuerth.mute} />
                  <Text className="text-[13px] text-wuerth-slate">
                    {formatDateRange(event.startAt, event.endAt)}
                  </Text>
                </View>
                {event.location ? (
                  <View className="flex-row items-center gap-2">
                    <MapPin size={15} color={wuerth.mute} />
                    <Text numberOfLines={1} className="flex-1 text-[13px] text-wuerth-slate">
                      {event.location}
                    </Text>
                  </View>
                ) : null}
                {event.attendeeCount > 0 ? (
                  <View className="flex-row items-center gap-2">
                    <Users size={15} color={wuerth.mute} />
                    <Text className="text-[13px] text-wuerth-slate">
                      {event.attendeeCount} {event.status === "past" ? "attended" : "checked in"}
                    </Text>
                  </View>
                ) : null}
              </View>
            </>
          )}
        </View>

        <View className="px-4 py-2.5">
          <SegmentedControl<Tab>
            scroll
            segments={[
              { value: "overview", label: "Overview" },
              { value: "people", label: "People" },
              { value: "applications", label: "Applications" },
              { value: "live", label: "Live" },
              { value: "files", label: "Files" },
            ]}
            value={tab}
            onChange={setTab}
          />
        </View>

        <View className="px-4 pb-6">
          {error ? (
            <Card className="items-center px-6 py-10">
              <Text className="text-sm font-bold text-wuerth-ink">Something went wrong</Text>
              <Text className="mt-1 max-w-[18rem] text-center text-sm text-wuerth-mute">
                We couldn&apos;t load this event. Check your connection or sign in again, then
                try reopening it.
              </Text>
            </Card>
          ) : !event ? (
            <Skeleton className="h-40 rounded-2xl" />
          ) : (
            <>
              {tab === "overview" &&
                (isUpcoming(event) ? <UpcomingNotice event={event} /> : <KpiPanel eventId={event.id} />)}

              {tab === "people" && (
                <View className="gap-5">
                  <View>
                    <SectionHeader>Attendees</SectionHeader>
                    <AttendeesPanel eventId={event.id} />
                  </View>
                  <View>
                    <SectionHeader>Interactions</SectionHeader>
                    <InteractionsPanel eventId={event.id} />
                  </View>
                </View>
              )}

              {tab === "applications" && (
                <View>
                  <SectionHeader>Applications</SectionHeader>
                  <ApplicationsPanel eventId={event.id} />
                  <Text className="mt-3 px-1 text-xs text-wuerth-mute">
                    Accepting an application registers that person as an attendee — they then
                    receive your broadcasts in the event channel.
                  </Text>
                </View>
              )}

              {tab === "live" && (
                <View className="gap-5">
                  <View>
                    <SectionHeader>Check-in / Check-out QR</SectionHeader>
                    <QrPanel eventId={event.id} />
                  </View>
                  <View>
                    <SectionHeader>Broadcast to attendees</SectionHeader>
                    <BroadcastPanel eventId={event.id} attendeeCount={event.attendeeCount} />
                  </View>
                  <View>
                    <SectionHeader>Crowd sentiment</SectionHeader>
                    <SentimentPanel eventId={event.id} liveEnabled={event.liveAnalyticsEnabled} />
                  </View>
                </View>
              )}

              {tab === "files" && (
                <View className="gap-5">
                  <View>
                    <SectionHeader>Files & materials</SectionHeader>
                    <MaterialsPanel eventId={event.id} />
                  </View>
                  <View>
                    <SectionHeader>Private notes</SectionHeader>
                    <NotesPanel eventId={event.id} />
                  </View>
                  <View>
                    <SectionHeader>Host report</SectionHeader>
                    <HostReportPanel eventId={event.id} />
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

function UpcomingNotice({ event }: { event: EventDetail }) {
  return (
    <View className="gap-4">
      <Card className="items-center px-6 py-10">
        <View className="h-14 w-14 items-center justify-center rounded-2xl bg-wuerth-red-soft">
          <CalendarClock size={26} color={wuerth.red} />
        </View>
        <Text className="mt-3 text-sm font-bold text-wuerth-ink">No KPIs yet</Text>
        <Text className="mt-1 max-w-[18rem] text-center text-sm text-wuerth-mute">
          This event hasn&apos;t started. KPIs appear once attendees start checking in. Use the Live
          tab to prepare check-in QR codes and the Files tab to share materials in advance.
        </Text>
      </Card>

      {event.goal || event.targetGroup ? (
        <Card className="p-4">
          {event.goal ? (
            <Text className="text-sm">
              <Text className="font-semibold text-wuerth-ink">Goal: </Text>
              <Text className="text-wuerth-slate">{event.goal}</Text>
            </Text>
          ) : null}
          {event.targetGroup ? (
            <Text className="mt-1.5 text-sm">
              <Text className="font-semibold text-wuerth-ink">Target group: </Text>
              <Text className="text-wuerth-slate">{event.targetGroup}</Text>
            </Text>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}
