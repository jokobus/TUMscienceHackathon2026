import { Badge } from "@/components/ui/Badge";
import { EVENT_HEALTH_LABEL, EVENT_HEALTH_TONE } from "@/lib/format";
import type { EventHealth } from "@/lib/types";

export function HealthBadge({ health }: { health: EventHealth }) {
  return (
    <Badge tone={EVENT_HEALTH_TONE[health]} dot>
      {EVENT_HEALTH_LABEL[health]}
    </Badge>
  );
}
