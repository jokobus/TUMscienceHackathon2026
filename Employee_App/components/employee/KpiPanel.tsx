"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  CheckCircle2,
  ExternalLink,
  Hourglass,
  Star,
  Target,
  UserCheck,
} from "lucide-react";
import type { EventKpis } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { pct } from "@/lib/utils";

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Activity;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="p-3.5">
      <div className="flex items-center gap-2 text-wuerth-mute">
        <Icon size={15} />
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <div className="mt-2 text-2xl font-extrabold leading-none text-wuerth-ink">{value}</div>
      {hint && <div className="mt-1 text-xs text-wuerth-mute">{hint}</div>}
    </Card>
  );
}

export function KpiPanel({ eventId }: { eventId: string }) {
  const [kpis, setKpis] = useState<EventKpis | null>(null);

  useEffect(() => {
    api.getEventKpis(eventId).then(setKpis);
  }, [eventId]);

  if (!kpis) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <KpiCard icon={Activity} label="Engagement" value={`${kpis.engagementIndex}`} hint="index · 0–100" />
        <KpiCard icon={Target} label="Qualified leads" value={`${kpis.qualifiedLeads}`} hint="check-in + signal" />
        <KpiCard icon={UserCheck} label="Check-in rate" value={pct(kpis.checkInRate)} hint={`${kpis.checkedIn}/${kpis.registered} registered`} />
        <KpiCard icon={CheckCircle2} label="Full sessions" value={pct(kpis.fullSessionRate)} hint={`${kpis.fullSessions} stayed`} />
        <KpiCard icon={Star} label="Recommendation" value={kpis.recommendationScore ? kpis.recommendationScore.toFixed(1) : "—"} hint={kpis.npsScore != null ? `NPS ${kpis.npsScore}` : "avg · 0–10"} />
        <KpiCard icon={Hourglass} label="Follow-ups" value={`${kpis.followUpsOpen}`} hint="open" />
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-wuerth-red-soft px-3.5 py-3 text-[13px] text-wuerth-red">
        <ExternalLink size={15} className="shrink-0" />
        <span>Compact KPIs only — full reports & analytics live on the Würth Web Dashboard.</span>
      </div>
    </div>
  );
}
