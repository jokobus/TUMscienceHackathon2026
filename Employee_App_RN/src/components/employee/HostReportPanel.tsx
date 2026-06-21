import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CheckCircle2, RotateCcw, Star, ThumbsUp, Wrench, XCircle } from "lucide-react-native";
import type { LucideIcon } from "lucide-react-native";
import type { HostRecommendation, HostReport } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import { wuerth } from "@/theme";

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <View className="flex-row gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <Pressable key={n} onPress={() => onChange(n)} accessibilityLabel={`${n} stars`}>
          <Star
            size={26}
            color={n <= value ? wuerth.red : "#d4d4d8"}
            fill={n <= value ? wuerth.red : "transparent"}
          />
        </Pressable>
      ))}
    </View>
  );
}

const recs: { value: HostRecommendation; label: string; icon: LucideIcon; tone: string; color: string }[] = [
  { value: "repeat", label: "Repeat", icon: ThumbsUp, tone: "text-emerald-600", color: "#059669" },
  { value: "improve", label: "Improve", icon: Wrench, tone: "text-amber-600", color: "#d97706" },
  { value: "stop", label: "Stop", icon: XCircle, tone: "text-wuerth-red", color: "#CC0000" },
];

export function HostReportPanel({ eventId }: { eventId: string }) {
  const { toast } = useToast();
  const [existing, setExisting] = useState<HostReport | null | undefined>(undefined);
  const [editing, setEditing] = useState(false);

  const [org, setOrg] = useState(4);
  const [relevance, setRelevance] = useState(4);
  const [quality, setQuality] = useState(4);
  const [rec, setRec] = useState<HostRecommendation>("repeat");
  const [notes, setNotes] = useState("");
  const [improvements, setImprovements] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getHostReport(eventId).then(setExisting).catch(() => setExisting(null));
  }, [eventId]);

  function hydrate(r: HostReport) {
    setOrg(r.organizationRating);
    setRelevance(r.audienceRelevanceRating);
    setQuality(r.interactionQualityRating);
    setRec(r.repeatRecommendation);
    setNotes(r.notes ?? "");
    setImprovements(r.suggestedImprovements ?? "");
  }

  async function submit() {
    setSaving(true);
    const saved = await api.submitHostReport(eventId, {
      organizationRating: org,
      audienceRelevanceRating: relevance,
      interactionQualityRating: quality,
      repeatRecommendation: rec,
      notes: notes.trim() || undefined,
      suggestedImprovements: improvements.trim() || undefined,
    });
    setExisting(saved);
    setEditing(false);
    setSaving(false);
    toast("Host report submitted ✓");
  }

  if (existing === undefined) return <Skeleton className="h-48 rounded-2xl" />;

  if (existing && !editing) {
    const recCfg = recs.find((r) => r.value === existing.repeatRecommendation)!;
    const RecIcon = recCfg.icon;
    return (
      <Card className="p-4">
        <View className="flex-row items-center gap-2">
          <CheckCircle2 size={18} color="#059669" />
          <Text className="text-sm font-bold text-emerald-600">Report submitted</Text>
        </View>
        <View className="mt-3 gap-2">
          <Row label="Organization" value={`${existing.organizationRating}/5`} />
          <Row label="Audience relevance" value={`${existing.audienceRelevanceRating}/5`} />
          <Row label="Interaction quality" value={`${existing.interactionQualityRating}/5`} />
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-wuerth-mute">Recommendation</Text>
            <View className="flex-row items-center gap-1">
              <RecIcon size={15} color={recCfg.color} />
              <Text className={cn("text-sm font-semibold", recCfg.tone)}>{recCfg.label}</Text>
            </View>
          </View>
        </View>
        {existing.notes ? (
          <Text className="mt-3 rounded-lg bg-zinc-50 p-2.5 text-[13px] text-wuerth-slate">
            {existing.notes}
          </Text>
        ) : null}
        {existing.suggestedImprovements ? (
          <Text className="mt-2 rounded-lg bg-amber-50 p-2.5 text-[13px] text-amber-800">
            <Text className="font-semibold">Improvements: </Text>
            {existing.suggestedImprovements}
          </Text>
        ) : null}
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onPress={() => {
            hydrate(existing);
            setEditing(true);
          }}
          icon={<RotateCcw size={14} color={wuerth.ink} />}
        >
          Edit report
        </Button>
      </Card>
    );
  }

  return (
    <Card className="gap-4 p-4">
      <RatingRow label="Organization" value={org} onChange={setOrg} />
      <RatingRow label="Audience relevance" value={relevance} onChange={setRelevance} />
      <RatingRow label="Interaction quality" value={quality} onChange={setQuality} />

      <View>
        <Text className="mb-2 text-sm font-semibold text-wuerth-ink">Repeat this event?</Text>
        <View className="flex-row gap-2">
          {recs.map((r) => {
            const Icon = r.icon;
            const active = rec === r.value;
            return (
              <Pressable
                key={r.value}
                onPress={() => setRec(r.value)}
                className={cn(
                  "flex-1 items-center gap-1 rounded-xl border py-2.5",
                  active ? "border-wuerth-red/40 bg-wuerth-red-soft" : "border-wuerth-line"
                )}
              >
                <Icon size={18} color={active ? r.color : wuerth.slate} />
                <Text className={cn("text-xs font-semibold", active ? r.tone : "text-wuerth-slate")}>
                  {r.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Textarea label="Notes" value={notes} onChangeText={setNotes} placeholder="What worked well?" />
      <Textarea
        label="Suggested improvements"
        value={improvements}
        onChangeText={setImprovements}
        placeholder="What to change next time?"
      />

      <Button block onPress={submit} loading={saving}>
        Submit host report
      </Button>
    </Card>
  );
}

function RatingRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm font-semibold text-wuerth-ink">{label}</Text>
      <Stars value={value} onChange={onChange} />
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between">
      <Text className="text-sm text-wuerth-mute">{label}</Text>
      <Text className="text-sm font-semibold text-wuerth-ink">{value}</Text>
    </View>
  );
}
