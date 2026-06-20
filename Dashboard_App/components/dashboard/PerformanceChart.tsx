"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getDashboardPerformance } from "@/lib/api";
import { useAsync } from "@/lib/useAsync";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/States";
import { DIMENSION_LABEL, EVENT_HEALTH_TONE } from "@/lib/format";
import type { PerformanceDimension } from "@/lib/types";

const DIMENSIONS: PerformanceDimension[] = [
  "relationship_roi",
  "brand_retention",
  "engagement",
  "returning_rate",
  "recommendation",
  "full_session",
  "follow_ups",
  "cost_per_lead",
  "host_experience",
  "health",
];

const TONE_FILL: Record<string, string> = {
  good: "#2F7D57",
  warn: "#9A6B16",
  risk: "#CC1122",
  info: "#3F5A73",
  neutral: "#C7C2B6",
};

/** Graphical event-performance control center (AGENT §1.2). */
export function PerformanceChart() {
  const [dimension, setDimension] = useState<PerformanceDimension>("relationship_roi");
  const { data, loading } = useAsync(() => getDashboardPerformance(dimension), [dimension]);

  return (
    <Card>
      <CardHeader
        eyebrow="Comparison"
        title="Event Performance"
        subtitle="Compare events on relationship & brand performance — not only commercial results."
        action={
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value as PerformanceDimension)}
            className="rounded-tag border border-we-line-strong bg-we-surface px-3 py-1.5 font-mono text-[11px] uppercase tracking-wider text-we-slate outline-none transition-colors hover:border-we-ink focus:border-we-ink"
          >
            {DIMENSIONS.map((d) => (
              <option key={d} value={d}>
                {DIMENSION_LABEL[d]}
              </option>
            ))}
          </select>
        }
      />
      <CardBody>
        {loading || !data ? (
          <Skeleton className="h-[300px] w-full" />
        ) : (
          <>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.points} margin={{ top: 8, right: 8, bottom: 8, left: -16 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E7E3D9" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#8B887E", fontFamily: "var(--font-mono)" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E7E3D9" }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#8B887E", fontFamily: "var(--font-mono)" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(27,26,24,0.04)" }}
                    contentStyle={{
                      borderRadius: 6,
                      border: "1px solid #E7E3D9",
                      fontSize: 12,
                      fontFamily: "var(--font-mono)",
                      boxShadow: "0 10px 30px -12px rgba(27,26,24,0.18)",
                    }}
                    formatter={(v: number) => [`${v} ${data.unit}`, DIMENSION_LABEL[data.dimension]]}
                  />
                  <Bar dataKey="value" radius={[3, 3, 0, 0]} maxBarSize={48}>
                    {data.points.map((p) => (
                      <Cell key={p.event_id} fill={TONE_FILL[EVENT_HEALTH_TONE[p.health]]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-xs text-we-muted">
              Bar colour reflects event-health classification. A smaller technical workshop can
              outperform a large fair on relationship metrics.
            </p>
          </>
        )}
      </CardBody>
    </Card>
  );
}
