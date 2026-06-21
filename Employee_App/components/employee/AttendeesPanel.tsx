"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { Attendee } from "@/lib/types";
import * as api from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Chip } from "@/components/ui/Chip";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { ProfileSheet, type ProfilePerson } from "@/components/employee/ProfileSheet";
import { formatTime } from "@/lib/utils";

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
      <Card className="divide-y divide-wuerth-line">
        {attendees.map((a) => {
          const chip = leadChip[a.leadStatus];
          return (
            <button
              key={a.userId}
              onClick={() => openProfile(a)}
              className="flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-zinc-50"
            >
              <Avatar name={a.displayName} size="md" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold text-wuerth-ink">{a.displayName}</div>
                <div className="truncate text-xs text-wuerth-mute">
                  {[a.university, a.studyDegree].filter(Boolean).join(" · ")}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <Chip tone={chip.tone}>{chip.label}</Chip>
                {a.checkedInAt && (
                  <span className="text-[11px] text-wuerth-mute">
                    {a.fullSession ? "Full session" : `in ${formatTime(a.checkedInAt)}`}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </Card>

      <ProfileSheet person={selected} onClose={() => setSelected(null)} />
    </>
  );
}
