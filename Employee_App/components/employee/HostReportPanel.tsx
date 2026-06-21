"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, RotateCcw, Star, ThumbsUp, Wrench, XCircle } from "lucide-react";
import type { HostRecommendation, HostReport } from "@/lib/types";
import * as api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => onChange(n)} aria-label={`${n} stars`}>
          <Star
            size={26}
            className={cn(n <= value ? "fill-wuerth-red text-wuerth-red" : "text-zinc-300")}
          />
        </button>
      ))}
    </div>
  );
}

const recs: { value: HostRecommendation; label: string; icon: typeof ThumbsUp; tone: string }[] = [
  { value: "repeat", label: "Repeat", icon: ThumbsUp, tone: "text-emerald-600" },
  { value: "improve", label: "Improve", icon: Wrench, tone: "text-amber-600" },
  { value: "stop", label: "Stop", icon: XCircle, tone: "text-wuerth-red" },
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
    api.getHostReport(eventId).then(setExisting);
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

  // Read-only view of an existing report
  if (existing && !editing) {
    const recCfg = recs.find((r) => r.value === existing.repeatRecommendation)!;
    const RecIcon = recCfg.icon;
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2 text-emerald-600">
          <CheckCircle2 size={18} />
          <span className="text-sm font-bold">Report submitted</span>
        </div>
        <dl className="mt-3 space-y-2 text-sm">
          <Row label="Organization" value={`${existing.organizationRating}/5`} />
          <Row label="Audience relevance" value={`${existing.audienceRelevanceRating}/5`} />
          <Row label="Interaction quality" value={`${existing.interactionQualityRating}/5`} />
          <div className="flex items-center justify-between">
            <dt className="text-wuerth-mute">Recommendation</dt>
            <dd className={cn("flex items-center gap-1 font-semibold", recCfg.tone)}>
              <RecIcon size={15} /> {recCfg.label}
            </dd>
          </div>
        </dl>
        {existing.notes && <p className="mt-3 rounded-lg bg-zinc-50 p-2.5 text-[13px] text-wuerth-slate">{existing.notes}</p>}
        {existing.suggestedImprovements && (
          <p className="mt-2 rounded-lg bg-amber-50 p-2.5 text-[13px] text-amber-800">
            <span className="font-semibold">Improvements: </span>
            {existing.suggestedImprovements}
          </p>
        )}
        <Button
          variant="secondary"
          size="sm"
          className="mt-3"
          onClick={() => {
            hydrate(existing);
            setEditing(true);
          }}
        >
          <RotateCcw size={14} /> Edit report
        </Button>
      </Card>
    );
  }

  // Form
  return (
    <Card className="space-y-4 p-4">
      <RatingRow label="Organization" value={org} onChange={setOrg} />
      <RatingRow label="Audience relevance" value={relevance} onChange={setRelevance} />
      <RatingRow label="Interaction quality" value={quality} onChange={setQuality} />

      <div>
        <span className="mb-2 block text-sm font-semibold text-wuerth-ink">Repeat this event?</span>
        <div className="grid grid-cols-3 gap-2">
          {recs.map((r) => {
            const Icon = r.icon;
            const active = rec === r.value;
            return (
              <button
                key={r.value}
                onClick={() => setRec(r.value)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-2.5 text-xs font-semibold ring-1 transition-colors",
                  active ? "bg-wuerth-red-soft ring-wuerth-red/40" : "ring-wuerth-line hover:bg-zinc-50",
                  active ? r.tone : "text-wuerth-slate"
                )}
              >
                <Icon size={18} />
                {r.label}
              </button>
            );
          })}
        </div>
      </div>

      <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="What worked well?" />
      <Textarea label="Suggested improvements" value={improvements} onChange={(e) => setImprovements(e.target.value)} rows={2} placeholder="What to change next time?" />

      <Button block onClick={submit} loading={saving}>
        Submit host report
      </Button>
    </Card>
  );
}

function RatingRow({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm font-semibold text-wuerth-ink">{label}</span>
      <Stars value={value} onChange={onChange} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <dt className="text-wuerth-mute">{label}</dt>
      <dd className="font-semibold text-wuerth-ink">{value}</dd>
    </div>
  );
}
