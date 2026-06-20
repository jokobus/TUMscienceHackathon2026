"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  Award,
  Briefcase,
  Download,
  FileText,
  HelpCircle,
  LogIn,
  MessageCircle,
  Package,
  RefreshCw,
  Send,
  Star,
} from "lucide-react";
import type { Interaction, InteractionType } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { interactionLabel, timeAgo } from "@/lib/utils";

const icon: Partial<Record<InteractionType, typeof Activity>> = {
  check_in: LogIn,
  check_out: LogIn,
  full_session: Award,
  file_view: FileText,
  file_download: Download,
  memory_post: MessageCircle,
  question_asked: HelpCircle,
  application_submitted: Send,
  sample_interest: Package,
  project_interest: Briefcase,
  career_interest: Star,
  follow_up_request: RefreshCw,
  recommendation_submitted: Star,
  re_engagement: RefreshCw,
};

// Stronger signals get the brand-red dot (per the §8 weighting intuition).
const strong = new Set<InteractionType>([
  "application_submitted",
  "career_interest",
  "project_interest",
  "follow_up_request",
  "sample_interest",
  "re_engagement",
]);

export function InteractionsPanel({ eventId }: { eventId: string }) {
  const [items, setItems] = useState<Interaction[] | null>(null);

  useEffect(() => {
    api.getInteractions(eventId).then(setItems);
  }, [eventId]);

  if (!items) return <ListSkeleton rows={4} />;

  if (items.length === 0) {
    return (
      <EmptyState
        icon={Activity}
        title="No interactions yet"
        description="Check-ins, questions, downloads and interest signals will stream in here."
      />
    );
  }

  return (
    <Card className="p-2">
      <ol className="relative ml-3 border-l border-wuerth-line">
        {items.map((it) => {
          const Icon = icon[it.type] ?? Activity;
          const isStrong = strong.has(it.type);
          return (
            <li key={it.id} className="relative py-2.5 pl-5">
              <span
                className={`absolute -left-[9px] top-3 grid h-4 w-4 place-items-center rounded-full ring-2 ring-white ${
                  isStrong ? "bg-wuerth-red text-white" : "bg-zinc-200 text-wuerth-slate"
                }`}
              >
                <Icon size={9} />
              </span>
              <div className="flex items-center gap-2">
                <Avatar name={it.userName ?? "?"} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm text-wuerth-ink">
                    <span className="font-semibold">{it.userName ?? "Someone"}</span>{" "}
                    <span className="text-wuerth-slate">{interactionLabel(it.type).toLowerCase()}</span>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-wuerth-mute">{timeAgo(it.timestamp)}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </Card>
  );
}
