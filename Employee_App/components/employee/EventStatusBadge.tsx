import type { EventStatus } from "@/lib/types";
import { Chip } from "@/components/ui/Chip";

type Tone = "neutral" | "red" | "green" | "amber" | "blue" | "slate";

const map: Record<EventStatus, { label: string; tone: Tone }> = {
  draft: { label: "Draft", tone: "neutral" },
  planned: { label: "Planned", tone: "blue" },
  upcoming: { label: "Upcoming", tone: "amber" },
  ongoing: { label: "Live now", tone: "red" },
  past: { label: "Past", tone: "neutral" },
  cancelled: { label: "Cancelled", tone: "slate" },
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  if (status === "ongoing") {
    return (
      <Chip tone="red">
        <span className="mr-0.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-wuerth-red" />
        Live now
      </Chip>
    );
  }
  const cfg = map[status];
  return <Chip tone={cfg.tone}>{cfg.label}</Chip>;
}
