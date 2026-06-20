"use client";

import { useMemo, useState } from "react";
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
import { Skeleton } from "@/components/ui/States";
import { DIMENSION_LABEL } from "@/lib/format";
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

export function PerformanceChart() {
  const [dimension, setDimension] = useState<PerformanceDimension>("relationship_roi");
  const [selectedIds, setSelectedIds] = useState<Set<string> | null>(null);
  const { data, loading } = useAsync(() => getDashboardPerformance(dimension), [dimension]);

  const allIds = useMemo(() => data?.points.map((p) => p.event_id) ?? [], [data]);
  const visiblePoints = useMemo(() => {
    if (!data) return [];
    if (!selectedIds) return data.points;
    return data.points.filter((p) => selectedIds.has(p.event_id));
  }, [data, selectedIds]);

  function toggleEvent(eventId: string) {
    const base = selectedIds ? new Set(selectedIds) : new Set(allIds);
    if (base.has(eventId)) base.delete(eventId);
    else base.add(eventId);
    if (base.size === 0) {
      setSelectedIds(null);
      return;
    }
    setSelectedIds(base.size === allIds.length ? null : base);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h3 className="text-lg font-bold text-we-ink">Event Performance</h3>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-we-muted">
            Select events and compare one relationship metric. Emphasis comes from selection, not color coding.
          </p>
        </div>
        <select
          value={dimension}
          onChange={(e) => setDimension(e.target.value as PerformanceDimension)}
          className="rounded-tag border border-we-line-strong bg-white px-3 py-2 text-[12px] font-semibold text-we-slate outline-none transition-colors hover:border-we-ink focus:border-we-ink"
        >
          {DIMENSIONS.map((d) => (
            <option key={d} value={d}>
              {DIMENSION_LABEL[d]}
            </option>
          ))}
        </select>
      </div>

      {loading || !data ? (
        <Skeleton className="h-[360px] w-full" />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setSelectedIds(null)}
              className={`rounded-tag border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                selectedIds === null
                  ? "border-we-ink bg-we-ink text-white"
                  : "border-we-line bg-white text-we-muted hover:border-we-line-strong hover:text-we-ink"
              }`}
            >
              All events
            </button>
            {data.points.map((point) => {
              const active = selectedIds === null || selectedIds.has(point.event_id);
              return (
                <button
                  key={point.event_id}
                  type="button"
                  onClick={() => toggleEvent(point.event_id)}
                  className={`rounded-tag border px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                    active
                      ? "border-we-line-strong bg-white text-we-ink"
                      : "border-we-line bg-we-canvas text-we-faint hover:text-we-muted"
                  }`}
                >
                  {point.label}
                </button>
              );
            })}
          </div>

          <div className="rounded-card border border-we-line bg-white p-4">
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={visiblePoints} margin={{ top: 10, right: 10, bottom: 8, left: -18 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#E1E5EA" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#6F7480", fontFamily: "var(--font-inter)" }}
                    tickLine={false}
                    axisLine={{ stroke: "#E1E5EA" }}
                    interval={0}
                    angle={-10}
                    textAnchor="end"
                    height={48}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#6F7480", fontFamily: "var(--font-inter)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: "rgba(26,26,30,0.035)" }}
                    contentStyle={{
                      borderRadius: 10,
                      border: "1px solid #E1E5EA",
                      fontSize: 12,
                      color: "#1A1A1E",
                      boxShadow: "0 10px 24px -18px rgba(16,24,40,0.22)",
                    }}
                    formatter={(v: number) => [`${v} ${data.unit}`, DIMENSION_LABEL[data.dimension]]}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={52}>
                    {visiblePoints.map((point, index) => (
                      <Cell
                        key={point.event_id}
                        fill="#CC0000"
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
