import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Hourglass,
  type LucideIcon,
  Star,
  Target,
  UserCheck,
} from "lucide-react-native";
import type { EventKpis } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { pct } from "@/lib/utils";
import { wuerth } from "@/theme";

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-3.5" style={{ width: "48%" }}>
      <View className="flex-row items-center gap-2">
        <Icon size={15} color={wuerth.mute} />
        <Text className="text-xs font-semibold uppercase tracking-wide text-wuerth-mute">
          {label}
        </Text>
      </View>
      <Text className="mt-2 text-2xl font-extrabold leading-none text-wuerth-ink">{value}</Text>
      {hint ? <Text className="mt-1 text-xs text-wuerth-mute">{hint}</Text> : null}
    </Card>
  );
}

export function KpiPanel({ eventId }: { eventId: string }) {
  const [kpis, setKpis] = useState<EventKpis | null>(null);

  useEffect(() => {
    api.getEventKpis(eventId).then(setKpis).catch(() => {});
  }, [eventId]);

  if (!kpis) {
    return (
      <View className="flex-row flex-wrap justify-between gap-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24 w-[48%]" />
        ))}
      </View>
    );
  }

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap justify-between gap-y-3">
        <KpiCard icon={Activity} label="Engagement" value={`${kpis.engagementIndex}`} hint="index · 0–100" />
        <KpiCard icon={Target} label="Qualified leads" value={`${kpis.qualifiedLeads}`} hint="check-in + signal" />
        <KpiCard icon={UserCheck} label="Check-in rate" value={pct(kpis.checkInRate)} hint={`${kpis.checkedIn}/${kpis.registered} registered`} />
        <KpiCard icon={CheckCircle2} label="Full sessions" value={pct(kpis.fullSessionRate)} hint={`${kpis.fullSessions} stayed`} />
        <KpiCard icon={Star} label="Recommendation" value={kpis.recommendationScore ? kpis.recommendationScore.toFixed(1) : "—"} hint={kpis.npsScore != null ? `NPS ${kpis.npsScore}` : "avg · 0–10"} />
        <KpiCard icon={Hourglass} label="Follow-ups" value={`${kpis.followUpsOpen}`} hint="open" />
      </View>

      <View className="flex-row items-center gap-2 rounded-xl bg-wuerth-red-soft px-3.5 py-3">
        <ExternalLink size={15} color={wuerth.red} />
        <Text className="flex-1 text-[13px] text-wuerth-red">
          Compact KPIs only — full reports & analytics live on the Würth Web Dashboard.
        </Text>
      </View>
    </View>
  );
}
