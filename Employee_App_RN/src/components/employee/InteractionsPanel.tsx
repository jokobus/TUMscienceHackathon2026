import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import {
  Activity,
  Award,
  Briefcase,
  Download,
  FileText,
  HelpCircle,
  LogIn,
  type LucideIcon,
  MessageCircle,
  Package,
  RefreshCw,
  Send,
  Star,
} from "lucide-react-native";
import type { Interaction, InteractionType } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { interactionLabel, timeAgo } from "@/lib/utils";

const icon: Partial<Record<InteractionType, LucideIcon>> = {
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
    api.getInteractions(eventId).then(setItems).catch(() => setItems([]));
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
      <View className="ml-3 border-l border-wuerth-line">
        {items.map((it) => {
          const Icon = icon[it.type] ?? Activity;
          const isStrong = strong.has(it.type);
          return (
            <View key={it.id} className="relative py-2.5 pl-5">
              <View
                className={`absolute -left-[9px] top-3 h-4 w-4 items-center justify-center rounded-full border-2 border-white ${
                  isStrong ? "bg-wuerth-red" : "bg-zinc-200"
                }`}
              >
                <Icon size={9} color={isStrong ? "#fff" : "#52525B"} />
              </View>
              <View className="flex-row items-center gap-2">
                <Avatar name={it.userName ?? "?"} size="sm" />
                <View className="min-w-0 flex-1">
                  <Text numberOfLines={1} className="text-sm text-wuerth-ink">
                    <Text className="font-semibold">{it.userName ?? "Someone"}</Text>{" "}
                    <Text className="text-wuerth-slate">
                      {interactionLabel(it.type).toLowerCase()}
                    </Text>
                  </Text>
                </View>
                <Text className="text-xs text-wuerth-mute">{timeAgo(it.timestamp)}</Text>
              </View>
            </View>
          );
        })}
      </View>
    </Card>
  );
}
