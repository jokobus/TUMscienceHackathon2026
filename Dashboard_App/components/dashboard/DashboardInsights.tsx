"use client";

import { useState } from "react";
import { Card, CardBody } from "@/components/ui/Card";
import { KpiGrid } from "@/components/dashboard/KpiGrid";
import { NextBestEvents } from "@/components/dashboard/NextBestEvents";
import { PerformanceChart } from "@/components/dashboard/PerformanceChart";
import type { KpiSet } from "@/lib/types";

type InsightView = "kpis" | "performance";

export function DashboardInsights({
  kpis,
  loading,
}: {
  kpis?: KpiSet | null;
  loading?: boolean;
}) {
  const [view, setView] = useState<InsightView>("kpis");

  return (
    <div className="space-y-4">
      <div className="flex justify-center">
        <div className="grid w-full max-w-xl grid-cols-2 rounded-card border border-we-line bg-white p-1 shadow-card">
          <ViewButton active={view === "kpis"} onClick={() => setView("kpis")}>
            Global KPIs
          </ViewButton>
          <ViewButton active={view === "performance"} onClick={() => setView("performance")}>
            Performance
          </ViewButton>
        </div>
      </div>

      <Card className="overflow-visible">
        <CardBody className="overflow-visible p-4 md:p-5">
          {view === "kpis" ? (
            <>
              <KpiGrid kpis={kpis} loading={loading} />
              <NextBestEvents />
            </>
          ) : (
            <PerformanceChart />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function ViewButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-tag px-4 py-3 text-center text-xl font-bold transition-all duration-200 active:scale-95 ${
        active ? "bg-we-ink text-white shadow-card" : "text-we-muted hover:text-we-ink"
      }`}
    >
      {children}
    </button>
  );
}
