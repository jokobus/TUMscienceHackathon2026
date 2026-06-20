"use client";

/**
 * components/students/LightGCNPanel.tsx
 *
 * Drop this into the student detail page (<LightGCNPanel studentId={...} />).
 *
 * Shows top-3 recommended events per student with:
 *   • Relative rank score + absolute GCN confidence bars
 *   • Layer sparkline: content-only score (L0) → full collaborative score (L3)
 *     A rising sparkline means the graph is adding meaningful signal.
 *   • Natural-language reasons derived from feature-dimension alignment
 *   • Attribution badge for the academic jury
 */
import { useAsync } from "@/lib/useAsync";
import { getStudentRecommendations } from "@/lib/api";
import { EVENT_TYPE_LABEL } from "@/lib/format";
import type { EventRecommendation, EventType, LightGCNResult } from "@/lib/types";

// ── Inline SVG sparkline ──────────────────────────────────────────────────────
// Lightweight alternative to pulling in recharts for a 4-point line.
function LayerSparkline({ values }: { values: number[] }) {
  const W = 60;
  const H = 22;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 0.001;

  const points = values
    .map((v, i) => {
      const x = pad + (i / (values.length - 1)) * (W - pad * 2);
      const y = H - pad - ((v - min) / range) * (H - pad * 2);
      return [x, y] as const;
    });

  const polyline = points.map(([x, y]) => `${x},${y}`).join(" ");
  const [lx, ly] = points[points.length - 1];

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      className="shrink-0"
      aria-hidden="true"
    >
      <polyline
        points={polyline}
        fill="none"
        stroke="#7c3aed"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Ghost dots at intermediate layers */}
      {points.slice(0, -1).map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={1.5} fill="#7c3aed" opacity={0.4} />
      ))}
      {/* Solid dot at final layer */}
      <circle cx={lx} cy={ly} r={2.5} fill="#7c3aed" />
    </svg>
  );
}

// ── Score bar ─────────────────────────────────────────────────────────────────
function ScoreBar({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: number;
  accent?: boolean;
}) {
  const fill = accent ? "#7c3aed" : "#a78bfa";
  return (
    <div className="flex items-center gap-2">
      <span className="w-[72px] shrink-0 text-[11px] text-gray-400">{label}</span>
      <div className="flex-1 h-1 rounded-full overflow-hidden bg-gray-100">
        <div
          className="h-full rounded-full"
          style={{ width: `${Math.round(value * 100)}%`, background: fill }}
        />
      </div>
      <span className="w-7 text-right tabular-nums text-[11px] text-gray-500">
        {Math.round(value * 100)}%
      </span>
    </div>
  );
}

// ── Event-type badge colours ───────────────────────────────────────────────────
const TYPE_STYLE: Partial<Record<EventType, string>> = {
  workshop:        "bg-blue-50   text-blue-700   border-blue-100",
  technical_talk:  "bg-indigo-50 text-indigo-700 border-indigo-100",
  hackathon:       "bg-violet-50 text-violet-700 border-violet-100",
  career_fair:     "bg-emerald-50 text-emerald-700 border-emerald-100",
  lab_tour:        "bg-amber-50  text-amber-700  border-amber-100",
  recruiting_talk: "bg-rose-50   text-rose-700   border-rose-100",
  networking:      "bg-sky-50    text-sky-700    border-sky-100",
};

// ── Single recommendation card ────────────────────────────────────────────────
function RecCard({ rec, rank }: { rec: EventRecommendation; rank: number }) {
  const typeStyle =
    TYPE_STYLE[rec.event_type] ?? "bg-gray-50 text-gray-600 border-gray-100";

  return (
    <div className="rounded-xl border border-gray-100 bg-white p-3.5 space-y-2.5">
      {/* Header: rank + title + type badge + sparkline */}
      <div className="flex items-start gap-2">
        {/* Rank pill */}
        <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[11px] font-semibold text-violet-700">
          {rank}
        </span>

        {/* Title + type */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
            {rec.event_title}
          </p>
          <span
            className={`mt-1 inline-block rounded border px-1.5 py-0.5 text-[10px] font-medium ${typeStyle}`}
          >
            {EVENT_TYPE_LABEL[rec.event_type] ?? rec.event_type}
          </span>
        </div>

        {/* Layer sparkline */}
        <div className="flex flex-col items-end gap-0.5">
          <LayerSparkline values={rec.layer_contribution} />
          <span className="text-[10px] text-gray-400 leading-none">L0 → L3</span>
        </div>
      </div>

      {/* Score bars */}
      <div className="space-y-1">
        <ScoreBar label="Content fit" value={rec.feature_score} />
        <ScoreBar label="GCN score" value={rec.confidence} accent />
      </div>

      {/* Reason tags */}
      {rec.reasons.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {rec.reasons.map((r, i) => (
            <span
              key={i}
              className="rounded border border-gray-100 bg-gray-50 px-1.5 py-0.5 text-[11px] leading-tight text-gray-500"
            >
              {r}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Skeleton placeholder ──────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-2.5">
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-32 rounded-xl bg-gray-50 animate-pulse" />
      ))}
    </div>
  );
}

// ── Panel ─────────────────────────────────────────────────────────────────────
interface Props {
  studentId: string;
}

export function LightGCNPanel({ studentId }: Props) {
  const { data, loading, error } = useAsync<LightGCNResult>(
    () => getStudentRecommendations(studentId),
    [studentId]
  );

  if (loading) return <Skeleton />;
  if (error || !data || data.recommendations.length === 0) return null;

  const { model } = data;

  return (
    <section className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-900">
          Recommended next events
        </h3>
        <span className="flex items-center gap-1 rounded-full border border-violet-200 bg-violet-50 px-2 py-0.5 text-[11px] font-medium text-violet-700">
          LightGCN&nbsp;·&nbsp;{model.layers}L&nbsp;·&nbsp;d={model.embedding_dim}
        </span>
      </div>

      {/* Recommendation cards */}
      {data.recommendations.map((rec, i) => (
        <RecCard key={rec.event_id} rec={rec} rank={i + 1} />
      ))}

      {/* Academic attribution */}
      <p className="text-[11px] text-gray-400">
        Bipartite graph&nbsp;·&nbsp;{model.graph_edges}&nbsp;
        interaction{model.graph_edges !== 1 ? "s" : ""}&nbsp;·&nbsp;
        He et al., LightGCN, SIGIR&nbsp;2020
      </p>
    </section>
  );
}
