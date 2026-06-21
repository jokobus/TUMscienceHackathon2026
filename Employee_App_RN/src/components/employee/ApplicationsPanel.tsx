import { useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Check, ClipboardList, Eye, X } from "lucide-react-native";
import type { Application, ApplicationStatus } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { EmptyState } from "@/components/ui/EmptyState";
import { ListSkeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { timeAgo } from "@/lib/utils";

const statusChip: Record<
  ApplicationStatus,
  { label: string; tone: "green" | "amber" | "red" | "blue" }
> = {
  submitted: { label: "Submitted", tone: "blue" },
  under_review: { label: "Under review", tone: "amber" },
  accepted: { label: "Accepted", tone: "green" },
  rejected: { label: "Rejected", tone: "red" },
};

export function ApplicationsPanel({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    api.getApplications(eventId).then(setApplications).catch(() => setApplications([]));
  }, [eventId]);

  async function setStatus(app: Application, status: ApplicationStatus) {
    setBusyId(app.id);
    try {
      const updated = await api.updateApplicationStatus(app.id, status);
      setApplications((prev) =>
        (prev ?? []).map((a) => (a.id === updated.id ? updated : a))
      );
      if (status === "accepted") {
        toast(`${app.applicantEmail} accepted — now an attendee ✓`);
      } else if (status === "rejected") {
        toast("Application rejected", "info");
      } else {
        toast("Marked as under review", "info");
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Could not update application", "error");
    } finally {
      setBusyId(null);
    }
  }

  if (!applications) return <ListSkeleton rows={3} />;

  if (applications.length === 0) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="No applications yet"
        description="Applications to join this event appear here for you to review."
      />
    );
  }

  return (
    <View className="gap-2.5">
      {applications.map((app) => {
        const chip = statusChip[app.status];
        const busy = busyId === app.id;
        const decided = app.status === "accepted" || app.status === "rejected";
        return (
          <Card key={app.id} className="p-3.5">
            <View className="flex-row items-start justify-between gap-2">
              <View className="min-w-0 flex-1">
                <Text numberOfLines={1} className="text-sm font-semibold text-wuerth-ink">
                  {app.applicantEmail}
                </Text>
                <Text className="mt-0.5 text-xs text-wuerth-mute">
                  Applied {timeAgo(app.submittedAt)} ago
                </Text>
              </View>
              <Chip tone={chip.tone}>{chip.label}</Chip>
            </View>

            {app.answers.length > 0 ? (
              <View className="mt-3 gap-2 rounded-xl bg-zinc-50 p-3">
                {app.answers.map((ans, i) => (
                  <Text key={`${app.id}-${ans.questionId}-${i}`} className="text-sm leading-snug text-wuerth-slate">
                    {ans.answerText}
                  </Text>
                ))}
              </View>
            ) : null}

            <View className="mt-3 flex-row justify-end gap-2">
              {!decided ? (
                <Button
                  size="sm"
                  variant="secondary"
                  loading={busy}
                  disabled={app.status === "under_review"}
                  onPress={() => setStatus(app, "under_review")}
                  icon={<Eye size={15} color="#3F3F46" />}
                >
                  Review
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="danger"
                loading={busy}
                disabled={app.status === "rejected"}
                onPress={() => setStatus(app, "rejected")}
                icon={<X size={15} color="#CC0000" />}
              >
                Reject
              </Button>
              <Button
                size="sm"
                loading={busy}
                disabled={app.status === "accepted"}
                onPress={() => setStatus(app, "accepted")}
                icon={<Check size={15} color="#fff" />}
              >
                Accept
              </Button>
            </View>
          </Card>
        );
      })}
    </View>
  );
}
