import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { Users } from "lucide-react-native";
import type { Attendee } from "@/lib/types";
import * as api from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ProfileSheet, type ProfilePerson } from "@/components/employee/ProfileSheet";
import { cn, formatTime } from "@/lib/utils";

const leadChip: Record<Attendee["leadStatus"], { label: string; tone: "green" | "amber" | "neutral" }> = {
  qualified: { label: "Qualified lead", tone: "green" },
  checked_in: { label: "Checked in", tone: "amber" },
  registered: { label: "Registered", tone: "neutral" },
};

export function AttendeesPanel({ eventId }: { eventId: string }) {
  const [attendees, setAttendees] = useState<Attendee[] | null>(null);
  const [selected, setSelected] = useState<ProfilePerson | null>(null);

  useEffect(() => {
    api.getAttendees(eventId).then(setAttendees);
  }, [eventId]);

  function openProfile(a: Attendee) {
    const chip = leadChip[a.leadStatus];
    setSelected({
      name: a.displayName,
      role: "Student",
      badge: { label: chip.label, tone: chip.tone },
      details: [
        ...(a.university ? [{ label: "University", value: a.university }] : []),
        ...(a.studyDegree ? [{ label: "Programme", value: a.studyDegree }] : []),
        ...(a.checkedInAt ? [{ label: "Checked in", value: formatTime(a.checkedInAt) }] : []),
        { label: "Session", value: a.fullSession ? "Full session" : "Partial" },
      ],
    });
  }

  if (!attendees) return <ListSkeleton rows={4} />;

  if (attendees.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No attendees yet"
        description="Attendees appear here once they check in via the event QR."
      />
    );
  }

  return (
    <>
      <Card>
        {attendees.map((a, i) => {
          const chip = leadChip[a.leadStatus];
          return (
            <Pressable
              key={a.userId}
              onPress={() => openProfile(a)}
              className={cn(
                "flex-row items-center gap-3 p-3 active:bg-zinc-50",
                i > 0 && "border-t border-wuerth-line"
              )}
            >
              <Avatar name={a.displayName} size="md" />
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-semibold text-wuerth-ink">
                  {a.displayName}
                </Text>
                <Text numberOfLines={1} className="text-xs text-wuerth-mute">
                  {[a.university, a.studyDegree].filter(Boolean).join(" · ")}
                </Text>
              </View>
              <View className="items-end gap-1">
                <Chip tone={chip.tone}>{chip.label}</Chip>
                {a.checkedInAt ? (
                  <Text className="text-[11px] text-wuerth-mute">
                    {a.fullSession ? "Full session" : `in ${formatTime(a.checkedInAt)}`}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </Card>

      <ProfileSheet person={selected} onClose={() => setSelected(null)} />
    </>
  );
}
