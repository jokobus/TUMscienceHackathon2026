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
  good: "#1E9E5A",
  warn: "#C77700",
  risk: "#CC0000",
  info: "#1F6FEB",
  neutral: "#9AA1AD",
};

/** Graphical event-performance control center (AGENT §1.2). */
export function PerformanceChart() {
  const [dimension, setDimension] = useState<PerformanceDimension>("relationship_roi");
  const { data, loading } = useAsync(() => getDashboardPerformance(dimension), [dimension]);

  return (
    <Card>
      <CardHeader
        title="Event Performance"
        subtitle="Compare events on relationship & brand performance — not only commercial results."
        action={
          <select
            value={dimension}
            onChange={(e) => setDimension(e.target.value as PerformanceDimension)}
            className="rounded-md border border-we-line bg-we-canvas px-2.5 py-1.5 text-xs font-medium text-we-slate outline-none focus:border-we-red"
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
                  <CartesianGrid strokeDasharray="3 3" stroke="#EEF0F3" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#6B7280" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E4E7EC" }}
                    interval={0}
                    angle={-12}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis tick={{ fontSize: 11, fill: "#6B7280" }} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: "rgba(204,0,0,0.04)" }}
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid #E4E7EC",
                      fontSize: 12,
                    }}
                    formatter={(v: number) => [`${v} ${data.unit}`, DIMENSION_LABEL[data.dimension]]}
                  />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={56}>
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
