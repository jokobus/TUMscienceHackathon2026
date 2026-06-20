import Link from "next/link";
import { CalendarDays, MapPin, Users } from "lucide-react";
import type { EventSummary } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { EventStatusBadge } from "@/components/employee/EventStatusBadge";
import { EventImageCarousel } from "@/components/employee/EventImageCarousel";
import { eventTypeLabel, formatDateRange } from "@/lib/utils";

export function EventCard({ event }: { event: EventSummary }) {
  const images = event.images ?? [];

  return (
    <Link href={`/events/${event.id}`} className="block">
      <Card className="overflow-hidden transition-shadow hover:shadow-pop">
        {images.length > 0 && (
          <div className="relative">
            <EventImageCarousel
              images={images}
              alt={event.title}
              className="h-44 w-full bg-zinc-100"
            />
            <div className="absolute right-3 top-3">
              <EventStatusBadge status={event.status} />
            </div>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-start justify-between gap-3">
            <Chip tone="red">{eventTypeLabel(event.type)}</Chip>
            {images.length === 0 && <EventStatusBadge status={event.status} />}
          </div>

          <h3 className="mt-2.5 text-[17px] font-bold leading-snug text-wuerth-ink">
            {event.title}
          </h3>

          <div className="mt-2.5 space-y-1.5 text-[13px] text-wuerth-slate">
            <div className="flex items-center gap-1.5">
              <CalendarDays size={15} className="text-wuerth-mute" />
              {formatDateRange(event.startAt, event.endAt)}
            </div>
            {event.location && (
              <div className="flex items-center gap-1.5">
                <MapPin size={15} className="text-wuerth-mute" />
                <span className="truncate">{event.location}</span>
              </div>
            )}
          </div>

          {event.attendeeCount > 0 && (
            <div className="mt-3.5 flex items-center gap-1.5 border-t border-wuerth-line pt-3 text-[13px] font-medium text-wuerth-slate">
              <Users size={15} className="text-wuerth-mute" />
              {event.attendeeCount} {event.status === "past" ? "attended" : "checked in"}
            </div>
          )}
        </div>
      </Card>
    </Link>
  );
}
